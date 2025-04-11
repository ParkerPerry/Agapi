/**
 * Test for the followers API
 */
const supertest = require('supertest');
const { z } = require('zod');
const { initializeBaseUrl, BASE_URLS } = require('./auth-helper.test.cjs');

// Define validation schema for follower
const followerSchema = z.object({
  id: z.number(),
  userId: z.number(),
  name: z.string(),
  personality: z.string().optional(),
  imageUrl: z.string().optional(),
  active: z.boolean().optional(),
  createdAt: z.string().or(z.date()).optional()
});

// Define validation schema for followers response
const followersResponseSchema = z.array(followerSchema);

// Base URL will be determined dynamically
let BASE_URL = BASE_URLS[0]; // Start with first option

describe('Followers API', () => {
  // Initialize before running tests
  beforeAll(async () => {
    BASE_URL = await initializeBaseUrl();
    console.log(`Followers API tests using base URL: ${BASE_URL}`);
  });
  
  // Get a new request object with the correct base URL
  const getRequest = () => supertest(BASE_URL);
  
  test('GET /api/followers requires authentication', async () => {
    const response = await getRequest().get('/api/followers');
    
    // Since we're not authenticated, we expect a 401 status
    expect(response.status).toBe(401);
  });
  
  test('GET /api/followers/:id requires authentication', async () => {
    // Try with ID 1
    const response = await getRequest().get('/api/followers/1');
    
    // Since we're not authenticated, we expect a 401 status
    expect(response.status).toBe(401);
  });
  
  // The following tests could be used if we implement authentication in tests
  // Currently commented out as we haven't set up authentication in our tests yet
  
  /*
  test('GET /api/followers returns an array when authenticated', async () => {
    // This would require setting up a test user and login flow
    // For now, we're just testing the unauthenticated behavior
    
    // Mock authentication would go here
    // const agent = await loginTestUser();
    
    const response = await getRequest().get('/api/followers');
    
    // Check if the endpoint returns a 200 status
    expect(response.status).toBe(200);
    
    // Check if the response is an array
    expect(Array.isArray(response.body)).toBe(true);
    
    // Validate each follower against the schema
    if (response.body.length > 0) {
      const validationResult = followersResponseSchema.safeParse(response.body);
      expect(validationResult.success).toBe(true);
      
      // If validation failed, show the error
      if (!validationResult.success) {
        console.error('Validation errors:', validationResult.error);
      }
    }
  });
  */
});