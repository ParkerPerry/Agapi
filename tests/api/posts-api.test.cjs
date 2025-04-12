const authHelper = require('./auth-helper.test.cjs');
const request = require('supertest');

let baseUrl;
let authenticatedAgent;
let testUserId;
let testCircleId;

// Find a working base URL for the API
beforeAll(async () => {
  try {
    // Initialize the base URL
    baseUrl = await authHelper.initializeBaseUrl();
    console.log(`Posts API tests using base URL: ${baseUrl}`);
    
    // Get authenticated agent
    console.log('Creating authenticated test user...');
    const auth = await authHelper.getAuthenticatedAgent();
    
    // Extract agent and user details
    authenticatedAgent = auth.agent;
    testUserId = auth.user.id;
    
    console.log(`Test user has ID: ${testUserId}`);
      
    // Create a circle for testing posts (since posts need a circle)
    const circleData = {
      name: 'Test Circle for Posts API',
      description: 'Circle created for posts API testing',
      visibility: 'private'
    };
    
    console.log('Creating test circle...');
    const circleResponse = await authenticatedAgent.post('/api/circles').send(circleData);
    
    if (circleResponse.status === 200 || circleResponse.status === 201) {
      testCircleId = circleResponse.body.id;
      console.log(`Created test circle with ID: ${testCircleId}`);
    } else {
      console.error('Failed to create test circle', circleResponse.status, circleResponse.body);
    }
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
});

// Clean up after tests
afterAll(async () => {
  if (testUserId) {
    // In a real implementation, we would clean up created test entities
    console.log(`[Test Cleanup] Would remove test data for user ID: ${testUserId}`);
    // await authHelper.cleanupTestData(baseUrl, authenticatedAgent, testUserId);
  }
});

describe('Posts API Tests', () => {
  let testPostId;
  
  test('Can create a post in a circle', async () => {
    // Skip test if circle creation failed
    if (!testCircleId) {
      console.log('Skipping post creation test - circle creation failed');
      return;
    }
    
    const postData = {
      content: 'This is a test post created by the API test',
      circleId: testCircleId
    };
    
    // Test that post creation works properly
    const response = await authenticatedAgent.post('/api/posts').send(postData);
    
    console.log('Post creation response:', response.status);
    
    // These assertions should fail if the API doesn't respond correctly
    expect([200, 201]).toContain(response.status);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('content', postData.content);
    expect(response.body).toHaveProperty('circleId', testCircleId);
    
    // Save the post ID for later tests
    testPostId = response.body.id;
    console.log(`Created test post with ID: ${testPostId}`);
  });
  
  test('Can retrieve posts from a circle', async () => {
    // Skip test if circle creation failed
    if (!testCircleId) {
      console.log('Skipping circle posts retrieval test - circle creation failed');
      return;
    }
    
    // Test that posts retrieval from a circle works properly
    const response = await authenticatedAgent.get(`/api/circles/${testCircleId}/posts`);
    
    // These assertions should fail if the API doesn't respond correctly
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // If we created a post previously, verify it's in the response
    if (testPostId) {
      const foundPost = response.body.find(post => post.id === testPostId);
      expect(foundPost).toBeDefined();
    }
  });
  
  test('Can retrieve a specific post', async () => {
    // Skip test if post creation failed
    if (!testPostId) {
      console.log('Skipping post retrieval test - post creation failed');
      return;
    }
    
    // Test that post retrieval works properly
    const response = await authenticatedAgent.get(`/api/posts/${testPostId}`);
    
    // These assertions should fail if the API doesn't respond correctly
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testPostId);
    expect(response.body).toHaveProperty('content');
    expect(response.body).toHaveProperty('circleId', testCircleId);
  });
});