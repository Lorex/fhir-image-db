const supertest = require('supertest');

describe('API Routes', function() {

  describe('GET /', function() {
    
    it('should respond with 200 status for root endpoint', function(done) {
      supertest(sails.hooks.http.app)
        .get('/')
        .expect(200)
        .end(done);
    });

  });

  describe('Route Configuration', function() {

    it('should handle CORS preflight requests', function(done) {
      supertest(sails.hooks.http.app)
        .options('/upload')
        .expect(function(res) {
          // Should not return 404 for OPTIONS request
          if (res.status === 404) {
            throw new Error('CORS preflight not configured properly');
          }
        })
        .end(done);
    });

    it('should respond to valid endpoints', function(done) {
      supertest(sails.hooks.http.app)
        .post('/upload')
        .expect(function(res) {
          // Should not be 404 (not found)
          if (res.status === 404) {
            throw new Error('Upload endpoint not configured');
          }
        })
        .end(done);
    });

  });

  describe('Error Handling', function() {

    it('should return proper error format', function(done) {
      supertest(sails.hooks.http.app)
        .post('/upload')
        .expect(400)
        .expect('Content-Type', /json/)
        .expect(function(res) {
          if (typeof res.body !== 'object') {
            throw new Error('Error response should be JSON object');
          }
          if (typeof res.body.success === 'undefined') {
            throw new Error('Error response should include success field');
          }
        })
        .end(done);
    });

  });

});