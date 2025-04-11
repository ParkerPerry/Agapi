/**
 * Test file for Circles API endpoints
 */
const supertest = require('supertest');
const { z } = require('zod');
const { initializeBaseUrl, BASE_URLS } = require('./auth-helper.test.cjs');

// Base URL will be determined dynamically
let BASE_URL = BASE_URLS[0]; // Start with first option

// Define validation schema for circle
const circleSchema = z.object({
  id: z.number(),
  createdAt: z.string().or(z.date()).nullable(),
  userId: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  visibility: z.enum(['private', 'shared']),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  isDefault: z.boolean()
});

// Schema for circle list
const circlesListSchema = z.array(circleSchema);

// Schema for circle member
const circleMemberSchema = z.object({
  id: z.number(),
  circleId: z.number(),
  userId: z.number(),
  role: z.enum(['owner', 'collaborator', 'viewer']),
  createdAt: z.string().or(z.date()).nullable()
});

// Schema for circle members list
const circleMembersListSchema = z.array(circleMemberSchema);

describe('Circles API', () => {
  // Initialize before running tests
  beforeAll(async () => {
    BASE_URL = await initializeBaseUrl();
    console.log(`Circles API tests using base URL: ${BASE_URL}`);
  });
  
  // Get a new request object with the correct base URL
  const getRequest = () => supertest(BASE_URL);
  
  test('GET /api/circles requires authentication', async () => {
    const response = await getRequest().get('/api/circles');
    
    // Since we're not authenticated, we expect a 401 status
    expect(response.status).toBe(401);
  });
  
  test('GET /api/circles/:id requires authentication', async () => {
    // Try with a circle ID that may or may not exist
    const response = await getRequest().get('/api/circles/1');
    
    // Since we're not authenticated, we expect a 401 status
    expect(response.status).toBe(401);
  });
  
  test('POST /api/circles requires authentication', async () => {
    const circleData = {
      name: 'Test Circle',
      description: 'This is a test circle',
      visibility: 'private'
    };
    
    const response = await getRequest().post('/api/circles').send(circleData);
    
    // Since we're not authenticated, we expect a 401 status
    expect(response.status).toBe(401);
  });
  
  test('GET /api/circles/:id/members is publicly accessible', async () => {
    const response = await getRequest().get('/api/circles/1/members');
    
    // This endpoint is public and doesn't require authentication
    expect(response.status).toBe(200);
  });
  
  test('POST /api/circles/:id/members is publicly accessible', async () => {
    const memberData = {
      userId: 2,
      role: 'viewer'
    };
    
    const response = await getRequest().post('/api/circles/1/members').send(memberData);
    
    // This endpoint is public and doesn't require authentication
    expect(response.status).toBe(200);
  });
});