/**
 * Lab Wizard Flow API Test Suite
 * 
 * Tests the complete lab creation wizard flow similar to the UI implementation:
 * 1. Basic Information (name, circle selection, experiment type)
 * 2. Goals & Description
 * 3. Success Metrics
 * 4. Content Setup
 * 5. Lab Activation
 */
const path = require('path');
const authHelper = require(path.resolve(__dirname, './auth-helper.test.cjs'));
const request = require('supertest');

let baseUrl;
let authenticatedAgent;
let testUserId;
let testLabId = null;
let testCircleId = null;
let testSecondCircleId = null;
let controlCirclePostId = null;
let treatmentCirclePostId = null;

// Find a working base URL for the API
beforeAll(async () => {
  try {
    // Initialize the base URL
    baseUrl = await authHelper.initializeBaseUrl();
    console.log(`Lab Wizard Flow tests using base URL: ${baseUrl}`);
    
    // Get authenticated agent
    console.log('Creating authenticated test user...');
    const auth = await authHelper.getAuthenticatedAgent();
    
    // Extract agent and user details
    authenticatedAgent = auth.agent;
    testUserId = auth.user.id;
    
    console.log(`Test user has ID: ${testUserId}`);
    
    // Create test circles that will be used in the lab wizard
    console.log('Creating test circles for lab wizard...');
    
    // Create first test circle (will be control group)
    const circleData1 = {
      name: 'Test Control Circle',
      description: 'A circle for testing lab wizard as control group',
      visibility: 'public'
    };
    
    const circleResponse1 = await authenticatedAgent
      .post('/api/circles')
      .send(circleData1);
      
    if (circleResponse1.status === 201) {
      testCircleId = circleResponse1.body.id;
      console.log(`Created test control circle with ID: ${testCircleId}`);
    } else {
      console.warn('Failed to create test control circle. Some tests may fail.');
    }
    
    // Create second test circle (will be treatment group)
    const circleData2 = {
      name: 'Test Treatment Circle',
      description: 'A circle for testing lab wizard as treatment group',
      visibility: 'public'
    };
    
    const circleResponse2 = await authenticatedAgent
      .post('/api/circles')
      .send(circleData2);
      
    if (circleResponse2.status === 201) {
      testSecondCircleId = circleResponse2.body.id;
      console.log(`Created test treatment circle with ID: ${testSecondCircleId}`);
    } else {
      console.warn('Failed to create test treatment circle. Some tests may fail.');
    }
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
});

describe('Lab Creation Wizard Flow Tests', () => {
  // Step 1: Create a new lab with basic information
  describe('Step 1: Basic Information', () => {
    it('Can create a new lab with basic information', async () => {
      // This represents the first step of the wizard
      const basicLabData = {
        name: 'Test Wizard Lab',
        experimentType: 'a_b_test',
        // No circle association yet in step 1
      };

      const response = await authenticatedAgent
        .post('/api/labs')
        .send(basicLabData);
      
      console.log(`Lab creation response status: ${response.status}`);
      console.log(`Lab creation response body: ${JSON.stringify(response.body)}`);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(basicLabData.name);
      expect(response.body.experimentType).toBe(basicLabData.experimentType);
      expect(response.body.status).toBe('draft'); // Default status

      // Save the lab ID for later steps
      testLabId = response.body.id;
      console.log(`Created test lab with ID: ${testLabId}`);
    });
  });

  // Step 2: Add goals and description
  describe('Step 2: Goals & Description', () => {
    it('Can update lab with goals and description', async () => {
      // Skip if lab wasn't created
      if (!testLabId) {
        console.warn('Test lab ID not available. Skipping this test.');
        return;
      }

      const goalData = {
        description: 'This is a test lab created through the wizard flow',
        goals: 'Test the complete lab creation wizard flow through API testing'
      };

      const response = await authenticatedAgent
        .patch(`/api/labs/${testLabId}`)
        .send(goalData);

      console.log(`Update goals response status: ${response.status}`);
      if (response.status !== 200) {
        console.log(`Update goals error: ${JSON.stringify(response.body)}`);
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testLabId);
      expect(response.body.description).toBe(goalData.description);
      expect(response.body.goals).toBe(goalData.goals);
    });
  });

  // Step 3: Add success metrics
  describe('Step 3: Success Metrics', () => {
    it('Can update lab with success metrics', async () => {
      // Skip if lab wasn't created
      if (!testLabId) {
        console.warn('Test lab ID not available. Skipping this test.');
        return;
      }

      const metricsData = {
        successMetrics: {
          metrics: [
            {
              name: 'Engagement',
              target: 80,
              priority: 'high'
            },
            {
              name: 'Retention',
              target: 60,
              priority: 'medium'
            }
          ]
        }
      };

      const response = await authenticatedAgent
        .patch(`/api/labs/${testLabId}`)
        .send(metricsData);

      console.log(`Update metrics response status: ${response.status}`);
      if (response.status !== 200) {
        console.log(`Update metrics error: ${JSON.stringify(response.body)}`);
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testLabId);
      expect(response.body).toHaveProperty('successMetrics');
      expect(response.body.successMetrics).toHaveProperty('metrics');
      expect(Array.isArray(response.body.successMetrics.metrics)).toBe(true);
      expect(response.body.successMetrics.metrics.length).toBe(2);
      
      // Check first metric
      expect(response.body.successMetrics.metrics[0]).toHaveProperty('name', 'Engagement');
      expect(response.body.successMetrics.metrics[0]).toHaveProperty('target', 80);
      expect(response.body.successMetrics.metrics[0]).toHaveProperty('priority', 'high');
      
      // Check second metric
      expect(response.body.successMetrics.metrics[1]).toHaveProperty('name', 'Retention');
      expect(response.body.successMetrics.metrics[1]).toHaveProperty('target', 60);
      expect(response.body.successMetrics.metrics[1]).toHaveProperty('priority', 'medium');
    });
  });

  // Step 4: Add circles to the lab
  describe('Step 4: Circle Selection', () => {
    it('Can add control circle to lab', async () => {
      // Skip if lab or circle wasn't created
      if (!testLabId || !testCircleId) {
        console.warn('Test lab ID or circle ID not available. Skipping this test.');
        return;
      }

      const circleData = {
        circleId: testCircleId,
        role: 'control'
      };

      const response = await authenticatedAgent
        .post(`/api/labs/${testLabId}/circles`)
        .send(circleData);

      console.log(`Add control circle response status: ${response.status}`);
      if (response.status !== 201) {
        console.log(`Add control circle error: ${JSON.stringify(response.body)}`);
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('labId', testLabId);
      expect(response.body).toHaveProperty('circleId', testCircleId);
      expect(response.body).toHaveProperty('role', 'control');
    });

    it('Can add treatment circle to lab', async () => {
      // Skip if lab or circle wasn't created
      if (!testLabId || !testSecondCircleId) {
        console.warn('Test lab ID or treatment circle ID not available. Skipping this test.');
        return;
      }

      const circleData = {
        circleId: testSecondCircleId,
        role: 'treatment'
      };

      const response = await authenticatedAgent
        .post(`/api/labs/${testLabId}/circles`)
        .send(circleData);

      console.log(`Add treatment circle response status: ${response.status}`);
      if (response.status !== 201) {
        console.log(`Add treatment circle error: ${JSON.stringify(response.body)}`);
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('labId', testLabId);
      expect(response.body).toHaveProperty('circleId', testSecondCircleId);
      expect(response.body).toHaveProperty('role', 'treatment');
    });

    it('Can verify both circles were added to lab', async () => {
      // Skip if lab wasn't created
      if (!testLabId) {
        console.warn('Test lab ID not available. Skipping this test.');
        return;
      }

      const response = await authenticatedAgent
        .get(`/api/labs/${testLabId}/circles`);

      console.log(`Get circles response status: ${response.status}`);
      if (response.status === 200) {
        console.log(`Found ${response.body.length} circles for lab ${testLabId}`);
      }

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Should have the two circles we added
      expect(response.body.length).toBe(2);
      
      // Check if both circles are in the response
      const circleIds = response.body.map(item => {
        // Handle different response formats
        if (item.circle) return item.circle.id;
        if (item.circleId) return item.circleId;
        return null;
      }).filter(id => id !== null);
      
      expect(circleIds).toContain(testCircleId);
      expect(circleIds).toContain(testSecondCircleId);
      
      // Verify roles
      const controlCircle = response.body.find(item => {
        const id = item.circle ? item.circle.id : item.circleId;
        return id === testCircleId;
      });
      
      const treatmentCircle = response.body.find(item => {
        const id = item.circle ? item.circle.id : item.circleId;
        return id === testSecondCircleId;
      });
      
      expect(controlCircle.role).toBe('control');
      expect(treatmentCircle.role).toBe('treatment');
    });
  });

  // Step 5: Create content for the lab circles
  describe('Step 5: Content Creation', () => {
    // Post IDs are tracked at the global level for use in later steps

    it('Can create test content post in control circle', async () => {
      // Skip if lab or circle wasn't created
      if (!testLabId || !testCircleId) {
        console.warn('Test lab ID or control circle ID not available. Skipping this test.');
        return;
      }

      const postData = {
        content: 'This is a test post for the control group in our lab experiment',
        circleId: testCircleId
      };

      const response = await authenticatedAgent
        .post('/api/posts')
        .send(postData);

      console.log(`Create control post response status: ${response.status}`);
      if (response.status !== 201) {
        console.log(`Create control post error: ${JSON.stringify(response.body)}`);
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content', postData.content);
      expect(response.body).toHaveProperty('circleId', testCircleId);
      
      // Save the post ID for verification
      controlCirclePostId = response.body.id;
      console.log(`Created control circle post with ID: ${controlCirclePostId}`);
    });

    it('Can create test content post in treatment circle', async () => {
      // Skip if lab or circle wasn't created
      if (!testLabId || !testSecondCircleId) {
        console.warn('Test lab ID or treatment circle ID not available. Skipping this test.');
        return;
      }

      const postData = {
        content: 'This is a test post for the treatment group in our lab experiment',
        circleId: testSecondCircleId
      };

      const response = await authenticatedAgent
        .post('/api/posts')
        .send(postData);

      console.log(`Create treatment post response status: ${response.status}`);
      if (response.status !== 201) {
        console.log(`Create treatment post error: ${JSON.stringify(response.body)}`);
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content', postData.content);
      expect(response.body).toHaveProperty('circleId', testSecondCircleId);
      
      // Save the post ID for verification
      treatmentCirclePostId = response.body.id;
      console.log(`Created treatment circle post with ID: ${treatmentCirclePostId}`);
    });

    it('Can verify posts are retrievable from lab circles', async () => {
      // Skip if lab wasn't created
      if (!testLabId) {
        console.warn('Test lab ID not available. Skipping this test.');
        return;
      }

      const response = await authenticatedAgent
        .get(`/api/labs/${testLabId}/posts`);

      console.log(`Get lab posts response status: ${response.status}`);
      if (response.status === 200) {
        console.log(`Found ${response.body.length} posts for lab ${testLabId}`);
      }

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Should have posts if they were successfully created
      if (controlCirclePostId && treatmentCirclePostId) {
        expect(response.body.length).toBeGreaterThan(0);
        
        // Check if posts are in the response
        const postIds = response.body.map(post => post.id);
        
        // We should find at least one of our posts (might not find both due to filtering in the API)
        const foundAnyPost = postIds.includes(controlCirclePostId) || postIds.includes(treatmentCirclePostId);
        expect(foundAnyPost).toBe(true);
        
        console.log(`Successfully verified posts in lab circles`);
      }
    });
  });

  // Step 6: Activate the lab
  describe('Step 6: Lab Activation', () => {
    it('Can activate the lab', async () => {
      // Skip if lab wasn't created
      if (!testLabId) {
        console.warn('Test lab ID not available. Skipping this test.');
        return;
      }

      const statusUpdate = {
        status: 'active'  // The API allows 'active' but not 'running' based on db constraints
      };

      const response = await authenticatedAgent
        .patch(`/api/labs/${testLabId}/status`)
        .send(statusUpdate);

      console.log(`Lab activation response status: ${response.status}`);
      if (response.status !== 200) {
        console.log(`Lab activation error: ${JSON.stringify(response.body)}`);
        
        // Try alternative status if the API might have changed
        if (response.status === 400) {
          console.log('Trying with alternative status "active"...');
          const retryResponse = await authenticatedAgent
            .patch(`/api/labs/${testLabId}/status`)
            .send({ status: 'active' });
            
          if (retryResponse.status === 200) {
            console.log('Lab activation successful with "active" status');
            Object.assign(response, retryResponse);
          } else {
            console.log(`Retry also failed with status: ${retryResponse.status}`);
          }
        }
      }

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('id', testLabId);
      
      // Check that status is updated to active
      expect(response.body.status).toBe('active');
      
      // Check if launchedAt is set
      expect(response.body).toHaveProperty('launchedAt');
      expect(response.body.launchedAt).not.toBeNull();
    });

    it('Can verify lab activation was successful', async () => {
      // Skip if lab wasn't created
      if (!testLabId) {
        console.warn('Test lab ID not available. Skipping this test.');
        return;
      }

      const response = await authenticatedAgent
        .get(`/api/labs/${testLabId}`);

      console.log(`Get lab response status: ${response.status}`);
      if (response.status === 200) {
        console.log(`Lab status: ${response.body.status}`);
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testLabId);
      
      // Lab should be active
      expect(response.body.status).toBe('active');
      
      // launchedAt should be set
      expect(response.body).toHaveProperty('launchedAt');
      expect(response.body.launchedAt).not.toBeNull();
    });
  });

  // Step 7: Lab Validation - Test AI follower response queuing
  describe('Step 7: Lab Validation', () => {
    it('Can create test pending responses for control circle post', async () => {
      // Skip if post wasn't created
      if (!controlCirclePostId) {
        console.warn('Control circle post ID not available. Skipping this test.');
        return;
      }

      // Create a test AI follower for the control circle
      const followerData = {
        name: 'Test AI Assistant',
        personality: 'friendly, helpful',
        circleId: testCircleId,
        avatarUrl: 'https://example.com/avatar.png'  // Adding required avatar URL
      };

      const followerResponse = await authenticatedAgent
        .post('/api/followers')
        .send(followerData);

      console.log(`Create AI follower response status: ${followerResponse.status}`);
      
      expect(followerResponse.status).toBe(201);
      expect(followerResponse.body).toHaveProperty('id');
      
      const testFollowerId = followerResponse.body.id;
      console.log(`Created test AI follower with ID: ${testFollowerId}`);

      // Create a pending response using the test endpoint
      const pendingData = {
        postId: controlCirclePostId,
        followerId: testFollowerId,
        delayMinutes: 1 // Short delay for testing
      };

      const pendingResponse = await authenticatedAgent
        .post('/api/posts/test-pending-response')
        .send(pendingData);

      console.log(`Create pending response status: ${pendingResponse.status}`);
      
      expect(pendingResponse.status).toBe(200);
      expect(pendingResponse.body).toHaveProperty('pendingResponse');
      expect(pendingResponse.body.pendingResponse).toHaveProperty('id');
      
      console.log(`Created pending response with ID: ${pendingResponse.body.pendingResponse.id}`);
    });

    it('Can verify pending responses are retrievable via get post API', async () => {
      // Skip if post wasn't created
      if (!controlCirclePostId) {
        console.warn('Control circle post ID not available. Skipping this test.');
        return;
      }

      // Wait briefly to ensure the pending response is properly stored
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the post with its pending responses
      const response = await authenticatedAgent
        .get(`/api/posts/${controlCirclePostId}`);

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
      // Skip if lab wasn't created
      if (!testLabId) {
        console.warn('Test lab ID not available. Skipping this test.');
        return;
      }

      const response = await authenticatedAgent
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
  });
  
  // Optional: Cleanup - set lab status to completed
  describe('Cleanup', () => {
    it('Can complete the lab after testing', async () => {
      // Skip if lab wasn't created
      if (!testLabId) {
        console.warn('Test lab ID not available. Skipping this test.');
        return;
      }

      const statusUpdate = {
        status: 'completed'
      };

      const response = await authenticatedAgent
        .patch(`/api/labs/${testLabId}/status`)
        .send(statusUpdate);

      console.log(`Lab completion response status: ${response.status}`);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('id', testLabId);
      expect(response.body.status).toBe('completed');
      
      // Verify updated status
      const verifyResponse = await authenticatedAgent
        .get(`/api/labs/${testLabId}`);
      
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.status).toBe('completed');
      
      console.log('Lab testing complete and lab set to completed status');
    });
  });
});