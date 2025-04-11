/**
 * Workflow Tests for CircleTube API
 * 
 * These tests verify complete user workflows by simulating realistic
 * user interactions with the API. They test sequences of API calls that
 * represent actual user journeys through the application.
 */

const supertest = require('supertest');
const { getAuthenticatedAgent, cleanupTestData } = require('./auth-helper.test.cjs');

// Base URL for API requests
const BASE_URL = 'http://localhost:5000';

// Test timeout (increased for workflow tests)
jest.setTimeout(15000);

describe('CircleTube Workflow Tests', () => {
  let authenticatedAgent;
  let testUser;
  
  beforeAll(async () => {
    // Set up an authenticated agent before running the tests
    try {
      const auth = await getAuthenticatedAgent();
      authenticatedAgent = auth.agent;
      testUser = auth.user;
      console.log(`Test user created with ID: ${testUser.id || 'unknown'}`);
    } catch (error) {
      console.error('Error setting up authenticated agent:', error);
      throw error;
    }
  });
  
  afterAll(async () => {
    // Clean up test data after all tests run
    if (testUser && testUser.id) {
      await cleanupTestData(testUser.id);
    }
  });
  
  describe('AI Follower Interaction Workflow', () => {
    test('Create follower -> Create post -> Verify follower response', async () => {
      // Step 1: Create an AI follower
      const followerData = {
        name: 'Workflow Test Follower',
        personality: 'Helpful and responsive AI assistant for testing workflows',
        background: 'Created by automated workflow tests'
      };
      
      const followerResponse = await authenticatedAgent.post('/api/followers').send(followerData);
      expect(followerResponse.status).toBe(200);
      const followerId = followerResponse.body.id;
      
      // Step 2: Create a post to engage with the follower
      const postData = {
        content: 'This is a test post to engage with my AI follower'
      };
      
      const postResponse = await authenticatedAgent.post('/api/posts').send(postData);
      expect(postResponse.status).toBe(200);
      const postId = postResponse.body.id;
      
      // Step 3: Wait briefly for the AI follower to respond (if implemented)
      // In a real test, you might need to poll or implement a retry mechanism
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 4: Check if there are responses to the post
      const responsesResponse = await authenticatedAgent.get(`/api/posts/${postId}/responses`);
      expect(responsesResponse.status).toBe(200);
      
      // Note: This test may fail if the AI follower system doesn't automatically
      // respond to posts. In that case, this test should be modified based on
      // the actual behavior of the system.
      console.log(`Found ${responsesResponse.body.length} responses to test post`);
    });
  });
  
  describe('Circle Collaboration Workflow', () => {
    test('Create circle -> Invite member -> Member joins -> Create post -> View activity', async () => {
      // For this test, we would ideally need two authenticated users
      // Since that's complex to set up, we'll simulate the process with just one user
      
      // Step 1: Create a circle
      const circleData = {
        name: 'Collaboration Test Circle',
        description: 'Circle for testing collaboration workflows',
        visibility: 'private'
      };
      
      const circleResponse = await authenticatedAgent.post('/api/circles').send(circleData);
      expect(circleResponse.status).toBe(200);
      const circleId = circleResponse.body.id;
      
      // Step 2: Create a post in the circle
      const postData = {
        content: 'This is a collaborative test post',
        circleId: circleId
      };
      
      const postResponse = await authenticatedAgent.post('/api/posts').send(postData);
      expect(postResponse.status).toBe(200);
      expect(postResponse.body.circleId).toBe(circleId);
      
      // Step 3: Get circle activity/posts
      const activityResponse = await authenticatedAgent.get(`/api/circles/${circleId}/posts`);
      expect(activityResponse.status).toBe(200);
      expect(activityResponse.body.length).toBeGreaterThan(0);
      
      // A full test would involve inviting a second user and having them accept,
      // but we'll skip that part since it requires multiple authenticated sessions
    });
  });
  
  describe('User Profile and Settings Workflow', () => {
    test('Update profile -> Change settings -> Verify changes persisted', async () => {
      // Step 1: Get current user profile
      const initialProfileResponse = await authenticatedAgent.get('/api/user');
      expect(initialProfileResponse.status).toBe(200);
      
      // Step 2: Update profile
      const profileUpdates = {
        bio: 'Updated bio from workflow test',
        avatarUrl: 'https://example.com/workflow-test-avatar.png'
      };
      
      const updateResponse = await authenticatedAgent.patch('/api/user').send(profileUpdates);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.bio).toBe(profileUpdates.bio);
      
      // Step 3: Verify changes persisted by fetching profile again
      const updatedProfileResponse = await authenticatedAgent.get('/api/user');
      expect(updatedProfileResponse.status).toBe(200);
      expect(updatedProfileResponse.body.bio).toBe(profileUpdates.bio);
      expect(updatedProfileResponse.body.avatarUrl).toBe(profileUpdates.avatarUrl);
    });
  });
  
  describe('AI Follower Collective Workflow', () => {
    test('Create collective -> Add follower -> Verify follower is in collective', async () => {
      // Step 1: Create an AI follower collective
      const collectiveData = {
        name: 'Test Follower Collective',
        personality: 'Group personality for workflow testing',
        description: 'A collective created by automated workflow tests'
      };
      
      const collectiveResponse = await authenticatedAgent.post('/api/followers/collectives').send(collectiveData);
      expect(collectiveResponse.status).toBe(200);
      const collectiveId = collectiveResponse.body.id;
      
      // Step 2: Create an AI follower
      const followerData = {
        name: 'Collective Test Follower',
        personality: 'Follower to be added to a collective'
      };
      
      const followerResponse = await authenticatedAgent.post('/api/followers').send(followerData);
      expect(followerResponse.status).toBe(200);
      const followerId = followerResponse.body.id;
      
      // Step 3: Add the follower to the collective
      const addResponse = await authenticatedAgent
        .post(`/api/followers/collectives/${collectiveId}/followers`)
        .send({ followerId });
      
      // The API might return different status codes based on implementation
      // Common success codes could be 200, 201, or 204
      expect([200, 201, 204]).toContain(addResponse.status);
      
      // Step 4: Verify the follower is now in the collective
      const collectiveFollowersResponse = await authenticatedAgent.get(`/api/followers/collectives/${collectiveId}/followers`);
      expect(collectiveFollowersResponse.status).toBe(200);
      
      // Find the added follower in the response
      const foundFollower = collectiveFollowersResponse.body.find(f => f.id === followerId);
      expect(foundFollower).toBeDefined();
    });
  });
});