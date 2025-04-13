/**
 * AI Follower Collectives API Tests
 * 
 * Tests the endpoints related to AI Follower Collectives, which are groups of
 * AI followers that can be managed together.
 */

const path = require('path');
const authHelper = require(path.resolve(__dirname, './auth-helper.test.cjs'));

let baseUrl;
let authenticatedAgent;
let testUserId;
let testFollowerId1;
let testFollowerId2;
let testCollectiveId;

// Find a working base URL for the API and prepare test environment
beforeAll(async () => {
  try {
    // Initialize the base URL
    baseUrl = await authHelper.initializeBaseUrl();
    console.log(`Follower Collectives API tests using base URL: ${baseUrl}`);
    
    // Get authenticated agent
    console.log('Creating authenticated test user...');
    const auth = await authHelper.getAuthenticatedAgent();
    
    // Extract agent and user details
    authenticatedAgent = auth.agent;
    testUserId = auth.user.id;
    
    console.log(`Test user has ID: ${testUserId}`);
    
    // Create a couple of test AI followers for our collective tests
    const followerData1 = {
      name: "Collective Test Follower 1",
      personality: "Member of a test collective",
      avatarUrl: "https://api.dicebear.com/6.x/bottts/svg?seed=collective-test-1",
      responsiveness: "active",
      type: "default"
    };
    
    const followerData2 = {
      name: "Collective Test Follower 2",
      personality: "Another member of a test collective",
      avatarUrl: "https://api.dicebear.com/6.x/bottts/svg?seed=collective-test-2",
      responsiveness: "active",
      type: "default"
    };
    
    // Create the first test follower
    const followerResponse1 = await authenticatedAgent.post('/api/followers').send(followerData1);
    expect([200, 201]).toContain(followerResponse1.status);
    testFollowerId1 = followerResponse1.body.id;
    
    // Create the second test follower
    const followerResponse2 = await authenticatedAgent.post('/api/followers').send(followerData2);
    expect([200, 201]).toContain(followerResponse2.status);
    testFollowerId2 = followerResponse2.body.id;
    
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

describe('AI Follower Collectives API Tests', () => {
  test('Can create a new AI follower collective', async () => {
    const collectiveData = {
      name: "Test Follower Collective",
      personality: "Collective personality for API testing",
      description: "A collective created for API testing"
    };
    
    const response = await authenticatedAgent.post('/api/followers/collectives').send(collectiveData);
    
    console.log(`Create collective response: ${response.status}`);
    
    // Accept different success status codes
    expect([200, 201]).toContain(response.status);
    expect(response.body).toHaveProperty('id');
    
    // Save the collective ID for later tests
    testCollectiveId = response.body.id;
  });
  
  test('Can get a list of AI follower collectives', async () => {
    const response = await authenticatedAgent.get('/api/followers/collectives');
    
    console.log(`Get collectives response: ${response.status}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // We should find our test collective in the list
    const foundCollective = response.body.find(c => c.id === testCollectiveId);
    expect(foundCollective).toBeDefined();
  });
  
  test('Can get details of a specific AI follower collective', async () => {
    const response = await authenticatedAgent.get(`/api/followers/collectives/${testCollectiveId}`);
    
    console.log(`Get collective details response: ${response.status}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testCollectiveId);
  });
  
  test('Can add a follower to a collective', async () => {
    const response = await authenticatedAgent
      .post(`/api/followers/collectives/${testCollectiveId}/followers`)
      .send({ followerId: testFollowerId1 });
    
    console.log(`Add follower to collective response: ${response.status}`);
    
    // Accept different success status codes
    expect([200, 201, 204]).toContain(response.status);
  });
  
  test('Can get members of a collective', async () => {
    // First add another follower to ensure we have multiple members
    await authenticatedAgent
      .post(`/api/followers/collectives/${testCollectiveId}/followers`)
      .send({ followerId: testFollowerId2 });
    
    const response = await authenticatedAgent.get(`/api/followers/collectives/${testCollectiveId}/members`);
    
    console.log(`Get collective members response: ${response.status}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // We should find both our test followers in the members list
    const foundFollower1 = response.body.find(f => f.id === testFollowerId1);
    const foundFollower2 = response.body.find(f => f.id === testFollowerId2);
    
    expect(foundFollower1).toBeDefined();
    expect(foundFollower2).toBeDefined();
  });
});