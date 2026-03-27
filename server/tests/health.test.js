const request = require('supertest');
const app = require('../index');

describe('Health Check System Probe', () => {
  it('should explicitly hook into the application returning a status OK', async () => {
    // Supertest injects a mock application wrapper into the local memory stack
    const res = await request(app).get('/health');
    
    // Evaluate the middleware return formats
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('OK');
  });
});
