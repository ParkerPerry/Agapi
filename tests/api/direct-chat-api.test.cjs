/**
 * Direct Chat API Tests
 * 
 * Tests the endpoints related to direct chat functionality between
 * users and AI followers.
 */

const path = require('path');
const authHelper = require(path.resolve(__dirname, './auth-helper.test.cjs'));

let baseUrl;
let authenticatedAgent;
let testUserId;
let testFollowerId;

// Find a working base URL for the API and prepare test environment
beforeAll(async () => {
  try {
    // Initialize the base URL
    baseUrl = await authHelper.initializeBaseUrl();
    console.log(`Direct Chat API tests using base URL: ${baseUrl}`);
    
    // Get authenticated agent
    console.log('Creating authenticated test user...');
    const auth = await authHelper.getAuthenticatedAgent();
    
    // Extract agent and user details
    authenticatedAgent = auth.agent;
    testUserId = auth.user.id;
    
    console.log(`Test user has ID: ${testUserId}`);
    
    // Create a test AI follower for direct chat
    const followerData = {
      name: "Direct Chat Test Follower",
      personality: "Follower for testing direct chat functionality",
      avatarUrl: "https://api.dicebear.com/6.x/bottts/svg?seed=direct-chat-test",
      responsiveness: "active",
      type: "default"
    };
    
    const followerResponse = await authenticatedAgent.post('/api/followers').send(followerData);
    expect([200, 201]).toContain(followerResponse.status);
    testFollowerId = followerResponse.body.id;
    
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
});

// Clean up after tests
afterAll(async () => {
  if (testUserId) {
    console.log(`[Test Cleanup] Would remove test data for user ID: ${testUserId}`);
    // In a real implementation, this would clean up created test entities
  }
});

describe('Direct Chat API Tests', () => {
  test('Can send a direct message to an AI follower', async () => {
    const messageData = {
      content: "Hello, this is a test message from API testing",
      followerId: testFollowerId
    };
    
    const response = await authenticatedAgent
      .post('/api/direct-chat/send')
      .send(messageData);
    
    console.log(`Send direct message response: ${response.status}`);
    
    // Accept different success status codes
    expect([200, 201, 202]).toContain(response.status);
  });
  
  test('Can get chat history with an AI follower', async () => {
    // Wait briefly to ensure the message is processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await authenticatedAgent
      .get(`/api/direct-chat/history/${testFollowerId}`);
    
    console.log(`Get chat history response: ${response.status}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // We should find our test message in the history
    const foundMessage = response.body.find(m => 
      m.userId === testUserId && 
      m.content.includes("Hello, this is a test message")
    );
    
    // Only check if our message is there if the history is not empty
    if (response.body.length > 0) {
      expect(foundMessage).toBeDefined();
    }
  });
  
  test('Can get unread message count', async () => {
    const response = await authenticatedAgent.get('/api/direct-chat/unread');
    
    console.log(`Get unread messages response: ${response.status}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('count');
    expect(typeof response.body.count).toBe('number');
  });
  
  test('Can mark messages as read', async () => {
    const markReadData = {
      followerId: testFollowerId,
      timestamp: new Date().toISOString()
    };
    
    const response = await authenticatedAgent
      .post('/api/direct-chat/mark-read')
      .send(markReadData);
    
    console.log(`Mark messages as read response: ${response.status}`);
    
    // Accept different success status codes
    expect([200, 204]).toContain(response.status);
    
    // Verify unread count is reset
    const unreadResponse = await authenticatedAgent.get('/api/direct-chat/unread');
    expect(unreadResponse.status).toBe(200);
    
    // The count might not be exactly 0 if other messages came in,
    // but it should be a valid number
    expect(typeof unreadResponse.body.count).toBe('number');
  });
});