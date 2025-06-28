const supertest = require('supertest');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const sinon = require('sinon');
const axios = require('axios');

describe('ImageController (圖片控制器)', () => {

  let sandbox;
  let imageDir;

  before(() => {
    imageDir = path.resolve(sails.config.appPath, 'assets/images');
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
    const files = fs.readdirSync(imageDir);
    for (const file of files) {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(imageDir, file));
      }
    }
  });

  describe('POST /upload (上傳圖片)', () => {

    it('應該要能成功上傳圖片、建立縮圖，並建立一個 FHIR DocumentReference', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
      const fhirId = '12345';
      const patientId = 'patient1';
      const practitionerId = 'practitioner1';

      const mockFhirResponse = { resourceType: 'DocumentReference', id: fhirId };
      const axiosStub = sandbox.stub(axios, 'post').resolves({ status: 201, data: mockFhirResponse });

      const res = await supertest(sails.hooks.http.app)
        .post('/upload')
        .field('patientId', patientId)
        .field('practitionerId', practitionerId)
        .attach('image', testImagePath)
        .expect(200);

      const { data } = res.body;
      assert(data.filename, 'Missing filename in response');
      assert(data['path-thumbnail'], 'Missing thumbnail path in response');

      // Verify original and thumbnail files exist
      const originalPath = path.join(imageDir, data.filename);
      const thumbnailPath = path.join(imageDir, path.basename(data['path-thumbnail']));
      assert(fs.existsSync(originalPath), 'Original file was not created');
      assert(fs.existsSync(thumbnailPath), 'Thumbnail file was not created');

      // Verify FHIR DocumentReference content
      const sentDocRef = axiosStub.getCall(0).args[1];
      assert.strictEqual(sentDocRef.content.length, 2, 'DocumentReference should have two content entries');
      assert.strictEqual(sentDocRef.content[0].attachment.title, 'full-image', 'First content entry should be full-image');
      assert.strictEqual(sentDocRef.content[1].attachment.title, 'thumbnail', 'Second content entry should be thumbnail');
    });

    it('若未提供 patientId，建立的 DocumentReference 中不應包含 subject 欄位', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
      const fhirId = '12345';
      const practitionerId = 'practitioner1';

      const mockFhirResponse = { resourceType: 'DocumentReference', id: fhirId };
      const axiosStub = sandbox.stub(axios, 'post').resolves({ status: 201, data: mockFhirResponse });

      await supertest(sails.hooks.http.app)
        .post('/upload')
        .field('practitionerId', practitionerId)
        .attach('image', testImagePath)
        .expect(200);

      const sentDocRef = axiosStub.getCall(0).args[1];
      assert.strictEqual(sentDocRef.subject, undefined, 'DocumentReference should not have a subject');
      assert.deepStrictEqual(sentDocRef.author, [{ reference: `Practitioner/${practitionerId}` }], 'DocumentReference has incorrect author');
    });

    it('若未提供 practitionerId，建立的 DocumentReference 中不應包含 author 欄位', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
      const fhirId = '12345';
      const patientId = 'patient1';

      const mockFhirResponse = { resourceType: 'DocumentReference', id: fhirId };
      const axiosStub = sandbox.stub(axios, 'post').resolves({ status: 201, data: mockFhirResponse });

      await supertest(sails.hooks.http.app)
        .post('/upload')
        .field('patientId', patientId)
        .attach('image', testImagePath)
        .expect(200);

      const sentDocRef = axiosStub.getCall(0).args[1];
      assert.strictEqual(sentDocRef.author, undefined, 'DocumentReference should not have an author');
      assert.deepStrictEqual(sentDocRef.subject, { reference: `Patient/${patientId}` }, 'DocumentReference has incorrect subject');
    });

    it('若兩者皆未提供，則建立的 DocumentReference 中不應包含 subject 和 author 欄位', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
      const fhirId = '12345';

      const mockFhirResponse = { resourceType: 'DocumentReference', id: fhirId };
      const axiosStub = sandbox.stub(axios, 'post').resolves({ status: 201, data: mockFhirResponse });

      await supertest(sails.hooks.http.app)
        .post('/upload')
        .attach('image', testImagePath)
        .expect(200);

      const sentDocRef = axiosStub.getCall(0).args[1];
      assert.strictEqual(sentDocRef.subject, undefined, 'DocumentReference should not have a subject');
      assert.strictEqual(sentDocRef.author, undefined, 'DocumentReference should not have an author');
    });
  });

  describe('DELETE /delete/:id (刪除指定圖片)', () => {

    const fhirId = 'test-fhir-id';
    const originalFilename = 'test-image.png';
    const thumbFilename = 'test-image_thumb.png';

    beforeEach(() => {
      const testImagePath = path.join(__dirname, '../fixtures', originalFilename);
      // Create dummy original and thumbnail files
      fs.copyFileSync(testImagePath, path.join(imageDir, originalFilename));
      fs.copyFileSync(testImagePath, path.join(imageDir, thumbFilename));
    });

    it('應該要能成功刪除原始圖片、縮圖以及對應的 FHIR 資源', async () => {
      const mockFhirResponseOnGet = {
        resourceType: 'DocumentReference',
        id: fhirId,
        content: [
          { attachment: { url: `http://localhost/images/${originalFilename}` } },
          { attachment: { url: `http://localhost/images/${thumbFilename}` } }
        ]
      };

      sandbox.stub(axios, 'get').resolves({ status: 200, data: mockFhirResponseOnGet });
      sandbox.stub(axios, 'delete').resolves({ status: 204 });

      const res = await supertest(sails.hooks.http.app)
        .delete(`/delete/${fhirId}`)
        .expect(200);

      assert.strictEqual(res.body.success, true, 'Expected success to be true');
      assert.strictEqual(fs.existsSync(path.join(imageDir, originalFilename)), false, 'Original file should be deleted');
      assert.strictEqual(fs.existsSync(path.join(imageDir, thumbFilename)), false, 'Thumbnail file should be deleted');
    });

    it('刪除 DocumentReference 時，應一併更新相關的 ClinicalImpression', async () => {
      const mockDocRef = {
        resourceType: 'DocumentReference',
        id: fhirId,
        content: [
          { attachment: { url: `http://localhost/images/${originalFilename}` } },
          { attachment: { url: `http://localhost/images/${thumbFilename}` } }
        ]
      };

      const anotherFhirId = 'another-fhir-id';
      const mockClinicalImpression = {
        resourceType: 'ClinicalImpression',
        id: 'ci123',
        supportingInfo: [
          { reference: `DocumentReference/${fhirId}` }, // This one should be deleted
          { reference: `DocumentReference/${anotherFhirId}` } // This one should remain
        ]
      };

      const axiosGetStub = sandbox.stub(axios, 'get');
      axiosGetStub.withArgs(sinon.match(`/DocumentReference/${fhirId}`)).resolves({ status: 200, data: mockDocRef });
      axiosGetStub.withArgs(sinon.match('/ClinicalImpression')).resolves({
        status: 200,
        data: {
          entry: [{ resource: mockClinicalImpression }]
        }
      });
      const axiosPutStub = sandbox.stub(axios, 'put').resolves({ status: 200 });
      sandbox.stub(axios, 'delete').resolves({ status: 204 });

      await supertest(sails.hooks.http.app)
        .delete(`/delete/${fhirId}`)
        .expect(200);

      assert(axiosPutStub.calledOnce, 'axios.put should be called once');
      const updatedClinicalImpression = axiosPutStub.getCall(0).args[1];
      assert.strictEqual(updatedClinicalImpression.supportingInfo.length, 1, 'supportingInfo should have 1 item left');
      assert.strictEqual(updatedClinicalImpression.supportingInfo[0].reference, `DocumentReference/${anotherFhirId}`, 'The correct supportingInfo should be kept');
    });
  });

  describe('DELETE /purge (清除所有圖片)', () => {
    it('應該要能成功清除所有已上傳的圖片', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
      const destImagePath = path.join(imageDir, path.basename(testImagePath));
      fs.copyFileSync(testImagePath, destImagePath);
      assert(fs.existsSync(destImagePath), `File should exist at ${destImagePath} before purge`);

      await supertest(sails.hooks.http.app)
        .delete('/purge')
        .expect(200);

      assert.strictEqual(fs.existsSync(destImagePath), false, `File should not exist at ${destImagePath} after purge`);
    });
  });

});
