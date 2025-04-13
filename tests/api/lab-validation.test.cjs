/**
 * Lab Validation API Test Suite
 * 
 * Tests just the lab validation step to ensure AI follower response queuing works
 * Uses the API trace helper for detailed API request/response logging
 */
const path = require('path');
const authHelper = require(path.resolve(__dirname, './auth-helper.test.cjs'));
const request = require('supertest');
const apiTraceHelper = require('../api-trace-helper.cjs');

// Clear trace data at the beginning of test execution
apiTraceHelper.clearTraceData();

let baseUrl;
let authenticatedAgent;
let tracedAgent; // Traced agent for API tracking
let testUserId;
let testCircleId = null;
let testLabId = null;
let testPostId = null;
let testFollowerId = null;

// Find a working base URL for the API
beforeAll(async () => {
  try {
    // Initialize the base URL
    baseUrl = await authHelper.initializeBaseUrl();
    console.log(`Lab Validation tests using base URL: ${baseUrl}`);
    
    // Get authenticated agent
    console.log('Creating authenticated test user...');
    const auth = await authHelper.getAuthenticatedAgent();
    
    // Extract agent and user details
    authenticatedAgent = auth.agent;
    testUserId = auth.user.id;
    
    // Create a traced agent for API request/response tracking
    tracedAgent = apiTraceHelper.traceAgent(authenticatedAgent);
    
    console.log(`Test user has ID: ${testUserId}`);
    
    // Create test circle 
    console.log('Creating test circle for lab validation...');
    
    const circleData = {
      name: 'Test Circle for Lab Validation',
      description: 'A circle for testing lab validation',
      visibility: 'public'
    };
    
    const circleResponse = await tracedAgent
      .post('/api/circles')
      .send(circleData);
      
    if (circleResponse.status === 201) {
      testCircleId = circleResponse.body.id;
      console.log(`Created test circle with ID: ${testCircleId}`);
    } else {
      console.warn('Failed to create test circle. Some tests may fail.');
    }
    
    // Create a test lab
    console.log('Creating test lab...');
    const labData = {
      name: 'Validation Test Lab',
      experimentType: 'a_b_test'
    };
    
    const labResponse = await tracedAgent
      .post('/api/labs')
      .send(labData);
    
    if (labResponse.status === 201) {
      testLabId = labResponse.body.id;
      console.log(`Created test lab with ID: ${testLabId}`);
      
      // Add circle to lab
      const circleAssociation = {
        circleId: testCircleId,
        role: 'control'
      };
      
      await tracedAgent
        .post(`/api/labs/${testLabId}/circles`)
        .send(circleAssociation);
        
      console.log('Added circle to lab');
      
      // Create a post in the circle
      const postData = {
        content: 'This is a test post for lab validation',
        circleId: testCircleId
      };
      
      const postResponse = await tracedAgent
        .post('/api/posts')
        .send(postData);
        
      if (postResponse.status === 201) {
        testPostId = postResponse.body.id;
        console.log(`Created test post with ID: ${testPostId}`);
        
        // Activate the lab
        await tracedAgent
          .patch(`/api/labs/${testLabId}/status`)
          .send({ status: 'active' });
          
        console.log('Activated test lab');
      }
    }
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
});

describe('Lab Validation Tests', () => {
  it('Can create an AI follower for the test circle', async () => {
    if (!testCircleId) {
      console.warn('Test circle ID not available. Skipping this test.');
      return;
    }
    
    const followerData = {
      name: 'Validation Test Assistant',
      personality: 'helpful, precise',
      circleId: testCircleId,
      avatarUrl: 'https://example.com/avatar.png'  // Adding required avatar URL
    };
    
    const response = await tracedAgent
      .post('/api/followers')
      .send(followerData);
      
    console.log(`Create AI follower response status: ${response.status}`);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    
    testFollowerId = response.body.id;
    console.log(`Created test AI follower with ID: ${testFollowerId}`);
  });
  
  it('Can create a pending response for the test post', async () => {
    if (!testPostId || !testFollowerId) {
      console.warn('Test post ID or follower ID not available. Skipping this test.');
      return;
    }
    
    const pendingData = {
      postId: testPostId,
      followerId: testFollowerId,
      delayMinutes: 1 // Short delay for testing
    };
    
    const response = await tracedAgent
      .post('/api/posts/test-pending-response')
      .send(pendingData);
      
    console.log(`Create pending response status: ${response.status}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('pendingResponse');
    expect(response.body.pendingResponse).toHaveProperty('id');
    
    console.log(`Created pending response with ID: ${response.body.pendingResponse.id}`);
  });
  
  it('Can verify pending responses are retrievable via get post API', async () => {
    if (!testPostId) {
      console.warn('Test post ID not available. Skipping this test.');
      return;
    }
    
    // Wait briefly to ensure the pending response is properly stored
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response = await tracedAgent
      .get(`/api/posts/${testPostId}`);
      
    console.log(`Get post with pending responses status: ${response.status}`);
    
    expect(response.status).toBe(200);
    
    // The API should include pendingResponses array
    expect(response.body).toHaveProperty('pendingResponses');
    
    // Log the pending responses
    if (response.body.pendingResponses && response.body.pendingResponses.length > 0) {
      console.log(`Found ${response.body.pendingResponses.length} pending responses for post`);
      console.log(`First pending response scheduled for: ${new Date(response.body.pendingResponses[0].scheduledFor).toISOString()}`);
    } else {
      console.log('No pending responses found in the response');
    }
    
    // Even if no pending responses are found, the property should exist
    expect(Array.isArray(response.body.pendingResponses)).toBe(true);
  });
  
  it('Can verify lab posts are properly processed by ThreadManager', async () => {
    if (!testLabId) {
      console.warn('Test lab ID not available. Skipping this test.');
      return;
    }
    
    const response = await tracedAgent
      .get(`/api/labs/${testLabId}/posts`);
      
    console.log(`Get lab posts with threads status: ${response.status}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    if (response.body.length > 0) {
      // Each post should have a threads property
      const firstPost = response.body[0];
      console.log(`Checking thread structure for post ID: ${firstPost.id}`);
      
      // Posts should have interactions and/or pending responses
      expect(firstPost).toHaveProperty('interactions');
      // If there are interactions, they should be an array
      expect(Array.isArray(firstPost.interactions)).toBe(true);
      
      console.log(`Post has ${firstPost.interactions.length} interactions`);
      
      // Post should also have pending responses (could be empty array)
      if (firstPost.pendingResponses) {
        console.log(`Post has ${firstPost.pendingResponses.length} pending responses`);
        
        if (firstPost.pendingResponses.length > 0) {
          // Validate the structure of pending responses
          const pendingResponse = firstPost.pendingResponses[0];
          expect(pendingResponse).toHaveProperty('id');
          expect(pendingResponse).toHaveProperty('scheduledFor');
          console.log(`Pending response scheduled for: ${new Date(pendingResponse.scheduledFor).toISOString()}`);
        }
      }
    }
  });
  
  // After all tests are done, generate the validation API trace report
  afterAll(() => {
    console.log('Generating validation API trace report...');
    apiTraceHelper.generateTraceReport('validation-api-trace');
    console.log('API trace report generation completed.');
  });
});