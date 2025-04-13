/**
 * Example test using the API trace helper
 * 
 * This test demonstrates how to use the API trace helper to track API requests
 * and responses during test execution.
 */
const apiTraceHelper = require('../api-trace-helper.cjs');
const authHelper = require('./auth-helper.test.cjs');

describe('API Trace Example', () => {
  let baseUrl;
  let tracedAgent;
  let testUserId;
  
  beforeAll(async () => {
    // Initialize the base URL
    baseUrl = await authHelper.initializeBaseUrl();
    console.log(`API Trace Example tests using base URL: ${baseUrl}`);
    
    // Create a test user
    console.log('Creating authenticated test user...');
    const { user, agent } = await authHelper.getAuthenticatedAgent();
    testUserId = user.id;
    
    // The agent is already traced by the auth helper, but we'll keep this line
    // for clarity and to show that we're specifically using tracing in this test
    tracedAgent = agent;
  });
  
  test('Trace GET /api/user endpoint', async () => {
    // Use the traced agent to make API calls
    const response = await tracedAgent.get('/api/user')
      .expect('Content-Type', /json/)
      .expect(200);
    
    // Validate the response
    expect(response.body.id).toBe(testUserId);
    expect(response.body.username).toBeDefined();
  });
  
  test('Trace POST endpoint', async () => {
    // Create a test circle
    const testCircle = {
      name: 'API Trace Test Circle',
      description: 'Circle created for API trace testing'
    };
    
    // Use the traced agent to make API calls
    const response = await tracedAgent.post('/api/circles')
      .send(testCircle)
      .expect('Content-Type', /json/)
      .expect(201);
    
    // Validate the response
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe(testCircle.name);
    expect(response.body.description).toBe(testCircle.description);
    expect(response.body.userId).toBe(testUserId);
    
    // Get the circle
    const circleId = response.body.id;
    const getResponse = await tracedAgent.get(`/api/circles/${circleId}`)
      .expect('Content-Type', /json/)
      .expect(200);
    
    // Validate the get response
    expect(getResponse.body.id).toBe(circleId);
    expect(getResponse.body.name).toBe(testCircle.name);
    
    // Update the circle with a PATCH request
    const updateResponse = await tracedAgent.patch(`/api/circles/${circleId}`)
      .send({ description: 'Updated description for API trace testing' })
      .expect('Content-Type', /json/)
      .expect(200);
    
    // Validate the update response
    expect(updateResponse.body.id).toBe(circleId);
    expect(updateResponse.body.description).toBe('Updated description for API trace testing');
  });
});