const supertest = require('supertest');
const path = require('path');
const fs = require('fs');

describe('ImageController', function() {

  describe('POST /upload', function() {
    
    it('should upload image successfully', function(done) {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
      
      supertest(sails.hooks.http.app)
        .post('/upload')
        .attach('image', testImagePath)
        .expect(200)
        .expect(function(res) {
          if (!res.body.data) throw new Error('Missing data in response');
          if (!res.body.data.filename) throw new Error('Missing filename in response');
          if (!res.body.data.url) throw new Error('Missing url in response');
          if (!res.body.data.delete) throw new Error('Missing delete url in response');
          if (!res.body.data.path) throw new Error('Missing path in response');
          if (!res.body.data.size) throw new Error('Missing size in response');
          if (!res.body.data.timestamp) throw new Error('Missing timestamp in response');
        })
        .end(done);
    });

    it('should return error when no file is uploaded', function(done) {
      supertest(sails.hooks.http.app)
        .post('/upload')
        .expect(400)
        .expect(function(res) {
          if (res.body.success !== false) throw new Error('Expected success to be false');
          if (res.body.err.code !== 'E_NO_FILE') throw new Error('Expected error code E_NO_FILE');
        })
        .end(done);
    });

    it('should return error when uploading non-image file', function(done) {
      // Create a temporary text file for testing
      const testTextFile = path.join(__dirname, '../fixtures/test.txt');
      fs.writeFileSync(testTextFile, 'This is a test text file');
      
      supertest(sails.hooks.http.app)
        .post('/upload')
        .attach('image', testTextFile)
        .expect(400)
        .expect(function(res) {
          if (res.body.success !== false) throw new Error('Expected success to be false');
          if (res.body.err.code !== 'E_TYPE') throw new Error('Expected error code E_TYPE');
        })
        .end(function(err) {
          // Clean up test file
          try {
            fs.unlinkSync(testTextFile);
          } catch (cleanupErr) {
            // Ignore cleanup errors
          }
          done(err);
        });
    });

    it('should handle file upload with proper content type', function(done) {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
      
      supertest(sails.hooks.http.app)
        .post('/upload')
        .attach('image', testImagePath)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(done);
    });

  });

  describe('DELETE /delete/:pid', function() {
    
    let uploadedFile;
    
    // Upload a file before each delete test
    beforeEach(function(done) {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
      
      supertest(sails.hooks.http.app)
        .post('/upload')
        .attach('image', testImagePath)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          uploadedFile = res.body.data;
          done();
        });
    });

    it('should delete uploaded image successfully', function(done) {
      if (!uploadedFile || !uploadedFile.filename) {
        return done(new Error('No uploaded file available for deletion test'));
      }

      // Extract pid from filename (remove extension and add underscore format)
      const { name, ext } = path.parse(uploadedFile.filename);
      const pid = `${name}_${ext.slice(1)}`; // Remove dot from extension
      
      supertest(sails.hooks.http.app)
        .delete(`/delete/${pid}`)
        .expect(200)
        .expect(function(res) {
          if (res.body.success !== true) throw new Error('Expected success to be true');
          if (!res.body.data) throw new Error('Missing data in response');
          if (!res.body.data.message) throw new Error('Missing success message');
        })
        .end(done);
    });

    it('should return error for invalid pid format', function(done) {
      supertest(sails.hooks.http.app)
        .delete('/delete/invalid-pid')
        .expect(400)
        .expect(function(res) {
          if (res.body.success !== false) throw new Error('Expected success to be false');
          if (res.body.err.code !== 'E_INVALID_PID') throw new Error('Expected error code E_INVALID_PID');
        })
        .end(done);
    });

    it('should handle deletion of non-existent file gracefully', function(done) {
      supertest(sails.hooks.http.app)
        .delete('/delete/nonexistent_jpg')
        .expect(200)
        .expect(function(res) {
          if (res.body.success !== true) throw new Error('Expected success to be true');
          if (!res.body.data) throw new Error('Missing data in response');
        })
        .end(done);
    });

  });

  describe('DELETE /purge', function() {
    
    // Upload some files before purge test
    beforeEach(function(done) {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
      let uploadCount = 0;
      const totalUploads = 2;
      
      function uploadComplete() {
        uploadCount++;
        if (uploadCount === totalUploads) {
          done();
        }
      }
      
      // Upload first file
      supertest(sails.hooks.http.app)
        .post('/upload')
        .attach('image', testImagePath)
        .expect(200)
        .end(uploadComplete);
      
      // Upload second file
      supertest(sails.hooks.http.app)
        .post('/upload')
        .attach('image', testImagePath)
        .expect(200)
        .end(uploadComplete);
    });

    it('should purge all uploaded images successfully', function(done) {
      supertest(sails.hooks.http.app)
        .delete('/purge')
        .expect(200)
        .expect(function(res) {
          if (res.body.success !== true) throw new Error('Expected success to be true');
          if (!res.body.data) throw new Error('Missing data in response');
          if (!res.body.data.message) throw new Error('Missing success message');
        })
        .end(done);
    });

    it('should handle purge when no files exist', function(done) {
      // First purge to clear any existing files
      supertest(sails.hooks.http.app)
        .delete('/purge')
        .expect(200)
        .end(function(err) {
          if (err) return done(err);
          
          // Second purge should still succeed
          supertest(sails.hooks.http.app)
            .delete('/purge')
            .expect(200)
            .expect(function(res) {
              if (res.body.success !== true) throw new Error('Expected success to be true');
              if (!res.body.data) throw new Error('Missing data in response');
            })
            .end(done);
        });
    });

  });

  describe('API Error Handling', function() {

    it('should return 404 for non-existent endpoints', function(done) {
      supertest(sails.hooks.http.app)
        .get('/nonexistent')
        .expect(404)
        .end(done);
    });

    it('should handle invalid HTTP methods on upload endpoint', function(done) {
      supertest(sails.hooks.http.app)
        .get('/upload')
        .expect(404)
        .end(done);
    });

  });

});