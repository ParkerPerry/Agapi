/**
 * Default Circle API Tests
 * 
 * Tests the endpoints related to default circle functionality.
 * The default circle is used as a fallback when no specific circle is selected.
 */

const path = require('path');
const authHelper = require(path.resolve(__dirname, './auth-helper.test.cjs'));

let baseUrl;
let authenticatedAgent;
let testUserId;

// Find a working base URL for the API and prepare test environment
beforeAll(async () => {
  try {
    // Initialize the base URL
    baseUrl = await authHelper.initializeBaseUrl();
    console.log(`Default Circle API tests using base URL: ${baseUrl}`);
    
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
    console.log(`[Test Cleanup] Would remove test data for user ID: ${testUserId}`);
    // In a real implementation, this would clean up created test entities
  }
});

describe('Default Circle API Tests', () => {
  test('Can get default circle using /api/default-circle endpoint', async () => {
    const response = await authenticatedAgent.get('/api/default-circle');
    
    console.log(`Get default circle response status: ${response.status}`);
    
    expect(response.status).toBe(200);
    
    // Log detailed information about the default circle
    console.log(`Default circle details:
      ID: ${response.body.id}
      Name: ${response.body.name}
      Owner: ${response.body.ownerId}
    `);
    
    // Validate default circle properties
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('ownerId');
    expect(response.body.ownerId).toBe(testUserId);
  });
  
  test('Can get default circle using alternative /api/circles/default endpoint', async () => {
    const response = await authenticatedAgent.get('/api/circles/default');
    
    console.log(`Get circles/default response status: ${response.status}`);
    
    expect(response.status).toBe(200);
    
    // Validate default circle properties
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('ownerId');
    expect(response.body.ownerId).toBe(testUserId);
  });
  
  test('Both default circle endpoints return the same circle', async () => {
    const response1 = await authenticatedAgent.get('/api/default-circle');
    const response2 = await authenticatedAgent.get('/api/circles/default');
    
    // Both responses should be successful
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    
    // Both endpoints should return the same circle ID
    expect(response1.body.id).toBe(response2.body.id);
    
    console.log(`Confirmed both endpoints return the same circle ID: ${response1.body.id}`);
  });
});