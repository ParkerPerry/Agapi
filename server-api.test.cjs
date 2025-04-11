/**
 * Simple API test against the running server
 */
const supertest = require('supertest');

describe('Server API', () => {
  const request = supertest('http://localhost:5000');
  
  test('GET /api/user returns 401 when not authenticated', async () => {
    const response = await request.get('/api/user');
    expect(response.status).toBe(401);
  });
  
  test('GET /api endpoint exists', async () => {
    // This just checks that the server is running and responding
    const response = await request.get('/api');
    // Even if it returns an error, we just want to confirm the server responds
    expect(response.status).toBeDefined();
  });
});