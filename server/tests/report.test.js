const request = require('supertest');

// Mock the logger to prevent DB calls during tests
jest.mock('../utils/logger', () => jest.fn().mockResolvedValue({}));

// Mock the auth middleware to bypass Firebase token verification for testing
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { uid: 'test-user-uid' }; 
  next();
});

// We also need to mock supabase to return a valid user and ensure ownership
jest.mock('../supabaseClient', () => {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(() => ({
      data: { id: 'mock-user-id', user_id: 'mock-user-id', farm_name: 'Test Farm', crop_type: 'Rice', created_at: new Date().toISOString() },
      error: null
    })),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
  };
});

const app = require('../index');

describe('PDF Report Generation Endpoint', () => {
  it('should generate a PDF for a valid farmId', async () => {
    const res = await request(app)
      .post('/api/report/generate')
      .send({ farmId: 'c5fb592c-1665-49a2-816c-43b38a915aae' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('AgriMicro_Report');
  });

  it('should fail if farmId is missing', async () => {
    const res = await request(app)
      .post('/api/report/generate')
      .send({});

    expect(res.statusCode).toBe(400);
  });
});
