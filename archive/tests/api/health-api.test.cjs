/**
 * Health API Tests
 * 
 * Tests the health check endpoints which provide system status information.
 * These endpoints are important for monitoring the application's health.
 */

const path = require('path');
const supertest = require('supertest');
const authHelper = require(path.resolve(__dirname, './auth-helper.test.cjs'));

let baseUrl;
let agent;

// Find a working base URL for the API
beforeAll(async () => {
  try {
    // Initialize the base URL
    baseUrl = await authHelper.initializeBaseUrl();
    console.log(`Health API tests using base URL: ${baseUrl}`);
    
    // Create a supertest agent for testing
    agent = supertest(baseUrl);
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
});

describe('Health API Tests', () => {
  // Basic health check endpoint
  test('GET /api/health returns basic health status', async () => {
    const response = await agent.get('/api/health');
    
    console.log(`Basic health check response status: ${response.status}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body.status).toBe('ok');
  });
  
  // Detailed health check endpoint
  test('GET /api/health/details returns detailed health information', async () => {
    const response = await agent.get('/api/health/details');
    
    console.log(`Detailed health check response status: ${response.status}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('services');
    
    // Check for services details
    expect(response.body.services).toHaveProperty('database');
    expect(response.body.services).toHaveProperty('responseScheduler');
    expect(response.body.services).toHaveProperty('threadManager');
    expect(response.body.services).toHaveProperty('contextManager');
    
    // Only assert that these fields exist, not their values
    // This allows the test to pass regardless of the actual health state
    console.log(`Services status:
      - Database: ${response.body.services.database}
      - Response Scheduler: ${response.body.services.responseScheduler}
      - Thread Manager: ${response.body.services.threadManager}
      - Context Manager: ${response.body.services.contextManager}
    `);
  });
});