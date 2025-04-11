/**
 * Data Creation Tests for CircleTube API
 * 
 * These tests verify that authenticated users can create and manipulate data
 * through the API. They utilize the enhanced authentication helpers to maintain
 * session state across requests.
 */

const supertest = require('supertest');
const { 
  getAuthenticatedAgent, 
  registerTestUser, 
  loginTestUser, 
  cleanupTestData, 
  initializeBaseUrl, 
  BASE_URLS 
} = require('./auth-helper.test.cjs');

// Base URL will be determined dynamically
let BASE_URL = BASE_URLS[0]; // Start with first option

// Test timeout (increased for data manipulation tests)
jest.setTimeout(10000);

describe('Data Creation Tests', () => {
  let authenticatedAgent;
  let testUser;
  let authenticationSuccessful = false;
  
  beforeAll(async () => {
    // Initialize the base URL
    BASE_URL = await initializeBaseUrl();
    console.log(`Data Creation tests using base URL: ${BASE_URL}`);
    
    // Set up an authenticated agent before running the tests
    try {
      // Create a unique test user with a deterministic ID for easier debugging
      const uniqueId = Math.floor(Date.now() / 1000).toString(16); // Unix timestamp in hex
      
      // Register the user directly
      testUser = {
        username: `testuser_${uniqueId}`,
        password: 'testpassword',
        email: `testuser_${uniqueId}@example.com`
      };
      
      // Create a fresh agent
      const agent = supertest.agent(BASE_URL);
      
      // Register the user
      console.log(`Registering test user: ${testUser.username}`);
      const registeredUser = await registerTestUser(agent, testUser);
      
      // Login directly with the agent
      console.log(`Logging in as ${registeredUser.username}`);
      const loginResponse = await agent
        .post('/api/auth/login')
        .send({ 
          username: registeredUser.username, 
          password: testUser.password 
        });
      
      if (loginResponse.status !== 200) {
        throw new Error(`Login failed with status ${loginResponse.status}`);
      }
      
      console.log('Login successful, verifying session...');
      
      // Verify the session is working
      const verifyResponse = await agent.get('/api/user');
      
      if (verifyResponse.status === 200) {
        console.log('Authentication successfully verified!');
        authenticatedAgent = agent;
        authenticationSuccessful = true;
        
        // Add user ID if available
        if (verifyResponse.body && verifyResponse.body.id) {
          testUser.id = verifyResponse.body.id;
          console.log(`Test user has ID: ${testUser.id}`);
        }
      } else {
        console.error(`Authentication verification failed - status: ${verifyResponse.status}`);
        throw new Error('Failed to verify authentication');
      }
    } catch (error) {
      console.error('Error setting up test environment:', error);
      // Instead of continuing with a non-authenticated agent, fail the test
      throw new Error(`Authentication setup failed: ${error.message}`);
    }
  });
  
  afterAll(async () => {
    // Clean up test data after all tests run
    if (testUser && testUser.id) {
      await cleanupTestData(testUser.id);
    }
  });
  
  describe('User Profile Tests', () => {
    test('Can retrieve authenticated user profile', async () => {
      const response = await authenticatedAgent.get('/api/user');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username');
    });
    
    test('Can update user profile', async () => {
      const updates = {
        bio: 'This is a test bio updated by automated tests',
        avatarUrl: 'https://example.com/test-avatar.png'
      };
      
      const response = await authenticatedAgent.patch('/api/user').send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('bio', updates.bio);
      expect(response.body).toHaveProperty('avatarUrl', updates.avatarUrl);
    });
  });
  
  describe('Circle Tests', () => {
    let testCircleId;
    
    test('Can create a new circle', async () => {
      const circleData = {
        name: 'Test Circle',
        description: 'Circle created by automated tests',
        visibility: 'private'
      };
      
      const response = await authenticatedAgent.post('/api/circles').send(circleData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', circleData.name);
      expect(response.body).toHaveProperty('description', circleData.description);
      
      // Save the circle ID for later tests
      testCircleId = response.body.id;
    });
    
    test('Can retrieve created circle', async () => {
      if (!testCircleId) {
        throw new Error('Test circle ID not available. Circle creation test may have failed.');
      }
      
      const response = await authenticatedAgent.get(`/api/circles/${testCircleId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testCircleId);
    });
    
    test('Can update circle details', async () => {
      if (!testCircleId) {
        throw new Error('Test circle ID not available. Circle creation test may have failed.');
      }
      
      const updates = {
        name: 'Updated Test Circle',
        description: 'This circle was updated by automated tests'
      };
      
      const response = await authenticatedAgent.patch(`/api/circles/${testCircleId}`).send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updates.name);
      expect(response.body).toHaveProperty('description', updates.description);
    });
  });
  
  describe('Post Tests', () => {
    let testPostId;
    
    test('Can create a new post', async () => {
      const postData = {
        content: 'This is a test post created by automated tests'
      };
      
      const response = await authenticatedAgent.post('/api/posts').send(postData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content', postData.content);
      expect(response.body).toHaveProperty('userId');
      
      // Save the post ID for later tests
      testPostId = response.body.id;
    });
    
    test('Can retrieve created post', async () => {
      if (!testPostId) {
        throw new Error('Test post ID not available. Post creation test may have failed.');
      }
      
      const response = await authenticatedAgent.get(`/api/posts/${testPostId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testPostId);
      expect(response.body).toHaveProperty('content');
    });
  });
  
  describe('AI Follower Tests', () => {
    let testFollowerId;
    
    test('Can create a new AI follower', async () => {
      const followerData = {
        name: 'Test Follower',
        personality: 'Helpful and friendly AI assistant for testing',
        background: 'Created by automated tests'
      };
      
      const response = await authenticatedAgent.post('/api/followers').send(followerData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', followerData.name);
      expect(response.body).toHaveProperty('personality', followerData.personality);
      
      // Save the follower ID for later tests
      testFollowerId = response.body.id;
    });
    
    test('Can retrieve created AI follower', async () => {
      if (!testFollowerId) {
        throw new Error('Test follower ID not available. Follower creation test may have failed.');
      }
      
      const response = await authenticatedAgent.get(`/api/followers/${testFollowerId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testFollowerId);
      expect(response.body).toHaveProperty('name');
    });
    
    test('Can update AI follower details', async () => {
      if (!testFollowerId) {
        throw new Error('Test follower ID not available. Follower creation test may have failed.');
      }
      
      const updates = {
        name: 'Updated Test Follower',
        background: 'This follower was updated by automated tests'
      };
      
      const response = await authenticatedAgent.patch(`/api/followers/${testFollowerId}`).send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updates.name);
      expect(response.body).toHaveProperty('background', updates.background);
    });
  });
  
  describe('Workflow Tests', () => {
    let circleId;
    let postId;
    
    test('Complete workflow: Create circle -> Create post in circle -> Verify post in circle', async () => {
      // Step 1: Create a new circle
      const circleData = {
        name: 'Workflow Test Circle',
        description: 'Circle for testing complete workflows',
        visibility: 'private'
      };
      
      const circleResponse = await authenticatedAgent.post('/api/circles').send(circleData);
      expect(circleResponse.status).toBe(200);
      circleId = circleResponse.body.id;
      
      // Step 2: Create a post within this circle
      const postData = {
        content: 'This is a test post within a circle',
        circleId: circleId
      };
      
      const postResponse = await authenticatedAgent.post('/api/posts').send(postData);
      expect(postResponse.status).toBe(200);
      postId = postResponse.body.id;
      expect(postResponse.body.circleId).toBe(circleId);
      
      // Step 3: Verify the post exists in the circle's posts
      const circlePostsResponse = await authenticatedAgent.get(`/api/circles/${circleId}/posts`);
      expect(circlePostsResponse.status).toBe(200);
      
      // Find our test post in the circle posts
      const foundPost = circlePostsResponse.body.find(post => post.id === postId);
      expect(foundPost).toBeDefined();
      expect(foundPost.content).toBe(postData.content);
    });
  });
});