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

  // Step 5: Activate the lab
  describe('Step 5: Lab Activation', () => {
    it('Can activate the lab', async () => {
      // Skip if lab wasn't created
      if (!testLabId) {
        console.warn('Test lab ID not available. Skipping this test.');
        return;
      }

      const statusUpdate = {
        status: 'running'  // Note: In routes.ts the valid status is 'running' not 'active'
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
      
      // Check that status is updated to running (or active)
      expect(['running', 'active']).toContain(response.body.status);
      
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
      
      // Lab should be either running or active
      expect(['running', 'active']).toContain(response.body.status);
      
      // launchedAt should be set
      expect(response.body).toHaveProperty('launchedAt');
      expect(response.body.launchedAt).not.toBeNull();
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