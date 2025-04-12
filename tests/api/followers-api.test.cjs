const authHelper = require('./auth-helper.test.cjs');
const request = require('supertest');

let baseUrl;
let authenticatedAgent;
let testUserId;

// Find a working base URL for the API
beforeAll(async () => {
  try {
    // Initialize the base URL
    baseUrl = await authHelper.initializeBaseUrl();
    console.log(`Followers API tests using base URL: ${baseUrl}`);
    
    // Get authenticated agent
    console.log('Creating authenticated test user...');
    const auth = await authHelper.getAuthenticatedAgent();
    
    // Extract agent and user details
    authenticatedAgent = auth.agent;
    testUserId = auth.user.id;
    
    console.log(`Test user has ID: ${testUserId}`);
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

describe('AI Follower API Specific Tests', () => {
  test('Can create an AI follower with complete required data', async () => {
    // Increase Jest timeout to 10 seconds because AI follower creation might take longer
    jest.setTimeout(10000);
    // This matches the server's expected format for the AI follower
    const followerData = {
      name: 'Test Bot',
      personality: 'Helpful and friendly AI assistant for testing',
      avatarUrl: 'https://api.dicebear.com/6.x/bottts/svg?seed=test-bot', // Adding the required avatarUrl field
      responsiveness: 'active', // Adding responsiveness which is also required
      type: 'default'
    };
    
    // Test that AI follower creation works properly
    const response = await authenticatedAgent.post('/api/followers').send(followerData);
    
    console.log('AI Follower creation response:', response.status, response.body);
    
    // These assertions should fail if the API doesn't respond correctly
    // Accept different success status codes
    expect([200, 201]).toContain(response.status);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', followerData.name);
  });
  
  test('Can query available AI follower types', async () => {
    // Test that follower types endpoint works properly
    const response = await authenticatedAgent.get('/api/followers/types');
    
    console.log('AI Follower types response:', response.status);
    
    // These assertions should fail if the API doesn't respond correctly
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});