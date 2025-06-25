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

    it('should upload image, create a thumbnail, and create a FHIR DocumentReference', async function() {
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
  });

  describe('DELETE /delete/:id', function() {

    const fhirId = 'test-fhir-id';
    const originalFilename = 'test-image.png';
    const thumbFilename = 'test-image_thumb.png';

    beforeEach(function() {
      const testImagePath = path.join(__dirname, '../fixtures', originalFilename);
      // Create dummy original and thumbnail files
      fs.copyFileSync(testImagePath, path.join(imageDir, originalFilename));
      fs.copyFileSync(testImagePath, path.join(imageDir, thumbFilename));
    });

    it('should delete original image, thumbnail, and FHIR resource successfully', async function() {
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