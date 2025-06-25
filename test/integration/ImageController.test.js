const supertest = require('supertest');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const sinon = require('sinon');
const axios = require('axios');

describe('ImageController', function() {

  let sandbox;
  let imageDir;

  before(function() {
    imageDir = path.resolve(sails.config.appPath, 'assets/images');
  });

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
    const files = fs.readdirSync(imageDir);
    for (const file of files) {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(imageDir, file));
      }
    }
  });

  describe('POST /upload', function() {

    it('should upload image successfully and create a FHIR DocumentReference', async function() {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
      const fhirId = '12345';
      const patientId = 'patient1';
      const practitionerId = 'practitioner1';

      const mockFhirResponse = {
        resourceType: 'DocumentReference',
        id: fhirId,
        status: 'current',
        content: [ { attachment: { title: 'test-image.png' } } ]
      };

      sandbox.stub(axios, 'post').resolves({ status: 201, data: mockFhirResponse });

      const res = await supertest(sails.hooks.http.app)
        .post('/upload')
        .field('patientId', patientId)
        .field('practitionerId', practitionerId)
        .attach('image', testImagePath)
        .expect(200);

      const { data } = res.body;
      assert(data.filename, 'Missing filename in response');
      assert(data.url, 'Missing url in response');
      assert.strictEqual(data.delete.endsWith(`/delete/${fhirId}`), true, 'Incorrect delete url');
      assert.deepStrictEqual(data.fhir, mockFhirResponse, 'FHIR response does not match');
    });

    it('should return error when patientId or practitionerId is missing', async function() {
        const testImagePath = path.join(__dirname, '../fixtures/test-image.png');

        const res = await supertest(sails.hooks.http.app)
          .post('/upload')
          .attach('image', testImagePath)
          .expect(400);

        assert.strictEqual(res.body.success, false);
        assert.strictEqual(res.body.err.code, 'E_MISSING_PARAMETERS');
      });
  });

  describe('DELETE /delete/:id', function() {

    const fhirId = 'test-fhir-id';
    let uploadedFilename;

    beforeEach(async function() {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
      uploadedFilename = path.basename(testImagePath);
      const imagePath = path.join(imageDir, uploadedFilename);
      fs.copyFileSync(testImagePath, imagePath);
      assert(fs.existsSync(imagePath), `File should exist at ${imagePath} before delete test`);

      sandbox.stub(axios, 'post').resolves({ status: 201, data: { id: fhirId, content: [{attachment:{title: uploadedFilename}}] } });
    });

    it('should delete uploaded image and FHIR resource successfully', async function() {
      const mockFhirResponseOnGet = {
        resourceType: 'DocumentReference',
        id: fhirId,
        content: [ { attachment: { title: uploadedFilename } } ]
      };

      sandbox.stub(axios, 'get').resolves({ status: 200, data: mockFhirResponseOnGet });
      sandbox.stub(axios, 'delete').resolves({ status: 204 });

      const res = await supertest(sails.hooks.http.app)
        .delete(`/delete/${fhirId}`)
        .expect(200);

      assert.strictEqual(res.body.success, true, 'Expected success to be true');
      const imagePath = path.join(imageDir, uploadedFilename);
      assert.strictEqual(fs.existsSync(imagePath), false, `File should not exist at ${imagePath} after deletion`);
    });

    it('should return 404 if the FHIR DocumentReference does not exist', async function() {
      const nonExistentId = 'non-existent-id';
      sandbox.stub(axios, 'get').rejects({ response: { status: 404 } });

      const res = await supertest(sails.hooks.http.app)
        .delete(`/delete/${nonExistentId}`)
        .expect(404);

      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, '找不到指定的 FHIR DocumentReference');
    });
  });

  describe('DELETE /purge', function() {
    it('should purge all uploaded images successfully', async function() {
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