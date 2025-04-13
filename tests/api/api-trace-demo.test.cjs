/**
 * API Call Tracing Demo Test
 * 
 * This test demonstrates the API call tracing functionality
 * by making various API calls and capturing the request/response details.
 */

const apiTraceUtils = require('../api-trace-utils.cjs');
const authHelperWithTracing = require('./auth-helper-with-tracing.cjs');
const fs = require('fs');
const path = require('path');

describe('API Trace Demo', () => {
  let agent;
  let testUserId;
  
  // Save API calls to file after all tests
  afterAll(() => {
    const outputDir = './test-reports';
    const outputFile = 'api-trace-demo.json';
    const htmlFile = 'api-trace-demo.html';
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save API calls to JSON file
    const jsonPath = path.join(outputDir, outputFile);
    apiTraceUtils.saveApiTraces(jsonPath);
    
    console.log(`API trace demo completed.`);
    console.log(`API trace data saved to ${jsonPath}`);
    console.log(`HTML report saved to ${jsonPath.replace('.json', '.html')}`);
  });
  
  // Initialize an authenticated agent before tests
  beforeAll(async () => {
    // Set current test context for proper test attribution in reports
    apiTraceUtils.setCurrentTest({
      name: 'API Trace Demo Setup',
      path: 'tests/api/api-trace-demo.test.cjs',
      fullName: 'API Trace Demo > Setup'
    });
    
    // Get an authenticated agent using the tracing helper
    agent = await authHelperWithTracing.getAuthenticatedAgent();
    testUserId = agent.testUser.id;
    
    expect(agent).toBeTruthy();
    expect(testUserId).toBeTruthy();
  });
  
  test('should trace user profile API call', async () => {
    // Set current test context
    apiTraceUtils.setCurrentTest({
      name: 'should trace user profile API call',
      path: 'tests/api/api-trace-demo.test.cjs',
      fullName: 'API Trace Demo > should trace user profile API call'
    });
    
    // Make an API call to get user profile
    const response = await agent.get('/api/user');
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(testUserId);
  });
  
  test('should trace circle creation API call', async () => {
    // Set current test context
    apiTraceUtils.setCurrentTest({
      name: 'should trace circle creation API call',
      path: 'tests/api/api-trace-demo.test.cjs',
      fullName: 'API Trace Demo > should trace circle creation API call'
    });
    
    // Create a test circle
    const circleData = {
      name: `Test Circle ${Date.now()}`,
      description: 'Created for API tracing demo',
    };
    
    // Make API call to create circle
    const response = await agent
      .post('/api/circles')
      .send(circleData);
    
    // Verify the response
    expect(response.status).toBe(201);
    expect(response.body.name).toBe(circleData.name);
    expect(response.body.userId).toBe(testUserId);
    
    // Store circle ID for subsequent tests
    const circleId = response.body.id;
    
    // Make another API call to get the circle
    const getResponse = await agent.get(`/api/circles/${circleId}`);
    
    // Verify the response
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(circleId);
  });
  
  test('should trace lab creation and configuration API calls', async () => {
    // Set current test context
    apiTraceUtils.setCurrentTest({
      name: 'should trace lab creation and configuration API calls',
      path: 'tests/api/api-trace-demo.test.cjs',
      fullName: 'API Trace Demo > should trace lab creation and configuration API calls'
    });
    
    // Create test circles first
    const testCircle = await agent
      .post('/api/circles')
      .send({
        name: `Test Circle ${Date.now()}`,
        description: 'Test circle for lab tracing'
      });
    
    const controlCircle = await agent
      .post('/api/circles')
      .send({
        name: `Control Circle ${Date.now()}`,
        description: 'Control circle for lab tracing'
      });
    
    // Create a lab
    const labData = {
      name: `API Trace Demo Lab ${Date.now()}`,
      experimentType: 'a_b_test',
      description: 'Created for API tracing demo'
    };
    
    const labResponse = await agent
      .post('/api/labs')
      .send(labData);
    
    expect(labResponse.status).toBe(201);
    const labId = labResponse.body.id;
    
    // Add test circle to lab
    const testCircleAddResponse = await agent
      .post(`/api/labs/${labId}/circles`)
      .send({
        circleId: testCircle.body.id,
        role: 'test'
      });
    
    expect(testCircleAddResponse.status).toBe(201);
    
    // Add control circle to lab
    const controlCircleAddResponse = await agent
      .post(`/api/labs/${labId}/circles`)
      .send({
        circleId: controlCircle.body.id,
        role: 'control'
      });
    
    expect(controlCircleAddResponse.status).toBe(201);
    
    // Update lab status to active
    const activateResponse = await agent
      .patch(`/api/labs/${labId}/status`)
      .send({ status: 'active' });
    
    expect(activateResponse.status).toBe(200);
    
    // Fetch all lab circles
    const labCirclesResponse = await agent.get(`/api/labs/${labId}/circles`);
    expect(labCirclesResponse.status).toBe(200);
    expect(labCirclesResponse.body.length).toBe(2);
  });
  
  test('should handle and trace error responses', async () => {
    // Set current test context
    apiTraceUtils.setCurrentTest({
      name: 'should handle and trace error responses',
      path: 'tests/api/api-trace-demo.test.cjs',
      fullName: 'API Trace Demo > should handle and trace error responses'
    });
    
    // Make an API call to a non-existent endpoint
    const nonExistentResponse = await agent.get('/api/non-existent-endpoint');
    expect(nonExistentResponse.status).toBe(404);
    
    // Try to access a non-existent circle
    const nonExistentCircleResponse = await agent.get('/api/circles/99999999');
    expect(nonExistentCircleResponse.status).toBe(404);
    
    // Try to access a non-existent lab
    const nonExistentLabResponse = await agent.get('/api/labs/99999999');
    expect(nonExistentLabResponse.status).toBe(404);
  });
});