const supertest = require('supertest');

describe('API 路由', () => {

  describe('GET / (根目錄)', () => {

    it('根目錄端點應該要能回傳 200 狀態碼', (done) => {
      supertest(sails.hooks.http.app)
        .get('/')
        .expect(200)
        .end(done);
    });

  });

  describe('路由設定', () => {

    it('應該要能處理 CORS preflight 請求', (done) => {
      supertest(sails.hooks.http.app)
        .options('/upload')
        .expect((res) => {
          // Should not return 404 for OPTIONS request
          if (res.status === 404) {
            throw new Error('CORS preflight not configured properly');
          }
        })
        .end(done);
    });

    it('應該要能回應有效的端點', (done) => {
      supertest(sails.hooks.http.app)
        .post('/upload')
        .expect((res) => {
          // Should not be 404 (not found)
          if (res.status === 404) {
            throw new Error('Upload endpoint not configured');
          }
        })
        .end(done);
    });

  });

  describe('錯誤處理', () => {

    it('應該要能回傳正確的錯誤格式', (done) => {
      supertest(sails.hooks.http.app)
        .post('/upload')
        .expect(400)
        .expect('Content-Type', /json/)
        .expect((res) => {
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
