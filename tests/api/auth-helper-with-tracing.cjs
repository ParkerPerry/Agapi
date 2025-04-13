/**
 * Authentication helper with API tracing for tests
 * 
 * This module extends the standard auth helper with API tracing capabilities
 */

const { z } = require('zod');
const { randomUUID } = require('crypto');
const apiTraceUtils = require('../api-trace-utils.cjs');

// Fixed base URL for API requests
const BASE_URL = 'http://localhost:5000';

/**
 * Find a working base URL for the API
 * @returns {Promise<string>} Working base URL
 */
async function findWorkingBaseUrl() {
  try {
    // Use our tracing agent
    const request = apiTraceUtils.createTracingAgent(BASE_URL);
    const response = await request.get('/api/user');
    
    // We expect a 401 for unauthenticated requests - that means the server is up
    if (response.status === 401) {
      console.log(`Successfully connected to ${BASE_URL} (got 401 as expected for unauthenticated request)`);
    } else {
      // If we got any response at all, the server is running
      console.log(`Connected to ${BASE_URL} with status ${response.status}`);
    }
  } catch (error) {
    console.log(`Warning: Could not connect to ${BASE_URL}: ${error.message}`);
    console.log('Continuing with tests anyway, but they may fail if the server is not running');
  }
  
  return BASE_URL;
}

/**
 * Initialize the base URL for API requests
 * @returns {Promise<string>} Base URL
 */
async function initializeBaseUrl() {
  await findWorkingBaseUrl();
  console.log(`Using fixed base URL: ${BASE_URL}`);
  return BASE_URL;
}

/**
 * Create a unique test user
 * @returns {Object} Test user data
 */
function createUniqueTestUser() {
  // Generate random values for username
  const uniqueId = randomUUID().replace(/-/g, '').substring(0, 8);
  
  return {
    username: `testuser_${uniqueId}`,
    email: `test_${uniqueId}@example.com`,
    password: 'TestPassword123!',
  };
}

/**
 * Register a test user
 * @param {Object} agent - Supertest agent
 * @param {Object} userData - User data for registration
 * @returns {Promise<Object>} Registered user data
 */
async function registerTestUser(agent, userData = null) {
  // Create unique test user if none provided
  const testUser = userData || createUniqueTestUser();
  console.log(`Attempting to register user: ${testUser.username}`);
  
  try {
    // Register the user
    const response = await agent
      .post('/api/register')
      .send(testUser);
    
    console.log(`Registration response status: ${response.status}`);
    
    // Handle both successful registration and user already exists
    if (response.status === 201 || response.status === 409) {
      console.log('Test user registration successful or user already exists');
      
      // If successful registration, store the original password
      // because the returned password is hashed
      if (response.status === 201 && response.body) {
        response.body.originalPassword = testUser.password;
        console.log(`Registered user data: ${JSON.stringify(response.body)}`);
        return response.body;
      }
      
      // If user already exists, try to login and get the user data
      if (response.status === 409) {
        const loginResponse = await agent
          .post('/api/login')
          .send({
            username: testUser.username,
            password: testUser.password
          });
        
        if (loginResponse.status === 200 && loginResponse.body) {
          loginResponse.body.originalPassword = testUser.password;
          return loginResponse.body;
        }
      }
      
      // If we can't get the user data, return the test user
      return {
        ...testUser,
        id: 999, // Dummy ID
        originalPassword: testUser.password,
      };
    } else {
      console.error(`User registration failed with status ${response.status}`);
      throw new Error(`Registration failed with status ${response.status}`);
    }
  } catch (error) {
    console.error(`Error registering test user: ${error.message}`);
    throw error;
  }
}

/**
 * Get an authenticated agent for API requests
 * @param {Object} userData - Optional user data for authentication
 * @returns {Promise<Object>} Authenticated agent
 */
async function getAuthenticatedAgent(userData = null) {
  try {
    if (!BASE_URL.includes('localhost')) {
      BASE_URL = await initializeBaseUrl();
    }
    
    // Create an agent with tracing
    const agent = apiTraceUtils.createTracingAgent(BASE_URL);
    
    // Create a unique test user
    const testUser = userData || createUniqueTestUser();
    
    // Register the new user
    const user = await registerTestUser(agent, testUser);
    
    // Direct implementation without relying on other helper functions
    console.log(`Direct auth attempt for user: ${user.username}`);
    
    // Login directly with the agent
    console.log(`Attempting login with username: ${user.username}`);
    
    // Use the original plaintext password for login, not the hashed password returned by the server
    const loginData = { 
      username: user.username, 
      password: user.originalPassword || user.password // Fall back to user.password if originalPassword doesn't exist
    };
    console.log(`Login data being sent: ${JSON.stringify(loginData)}`);
    
    const loginResponse = await agent
      .post('/api/login')
      .send(loginData);
    
    console.log(`Login response status: ${loginResponse.status}`);
    if (loginResponse.body) {
      console.log(`Login response body: ${JSON.stringify(loginResponse.body)}`);
    }
    
    if (loginResponse.status !== 200) {
      console.error(`Login failed with status ${loginResponse.status}`);
      
      // Instead of failing, we'll try a workaround to create a session
      console.log("Trying alternate session creation approach...");
      
      // First try to use a fresh agent
      const freshAgent = apiTraceUtils.createTracingAgent(BASE_URL);
      
      // Sometimes we need to hit an endpoint to establish a session before login
      await freshAgent.get('/api');
      
      // Try login again with the fresh agent
      const secondLoginResponse = await freshAgent
        .post('/api/login')
        .send(loginData);
      
      if (secondLoginResponse.status === 200) {
        console.log("Second login attempt successful!");
        
        // Store user ID for reference
        const userId = secondLoginResponse.body.id;
        
        // Verify the session is working by fetching user data
        const verificationResponse = await freshAgent.get('/api/user');
        if (verificationResponse.status === 200 && verificationResponse.body.id === userId) {
          console.log("Second login session verified!");
          
          // Add the user data to the agent for reference
          freshAgent.testUser = { ...user, ...secondLoginResponse.body };
          return freshAgent;
        } else {
          console.error(`Second login session verification failed: ${verificationResponse.status}`);
          throw new Error(`Authentication failed: Second login session verification failed`);
        }
      } else {
        console.error(`Second login attempt failed: ${secondLoginResponse.status}`);
        throw new Error(`Authentication failed: Second login attempt failed`);
      }
    }
    
    console.log('Login successful, verifying session...');
    
    // Extract cookies for debugging
    const cookies = loginResponse.headers['set-cookie'];
    console.log(`Received ${cookies ? cookies.length : 0} cookies from login response`);
    
    // Verify the session is working by fetching user data
    const verificationResponse = await agent.get('/api/user');
    console.log(`Verification response status: ${verificationResponse.status}`);
    
    // If verification fails, try fallback approach
    if (verificationResponse.status !== 200) {
      console.log('Session verification failed, trying fallback approach...');
      
      // Additional fallback: sometimes we need an extra request to establish the session
      await agent.get('/api');
      
      // Try verification again
      const secondVerificationResponse = await agent.get('/api/user');
      if (secondVerificationResponse.status === 200) {
        console.log('Fallback session verification successful!');
      } else {
        console.error(`Fallback session verification failed: ${secondVerificationResponse.status}`);
        throw new Error('Authentication failed: Session verification failed after fallback');
      }
    } else {
      console.log('Authentication successfully verified!');
      
      // Store real user ID from verification
      const realUserId = verificationResponse.body.id;
      if (realUserId) {
        console.log(`Got real user ID: ${realUserId}`);
        agent.testUser = { ...user, id: realUserId };
      } else {
        agent.testUser = user;
      }
    }
    
    return agent;
  } catch (error) {
    console.error(`Failed to create authenticated agent: ${error.message}`);
    throw error;
  }
}

module.exports = {
  BASE_URL,
  findWorkingBaseUrl,
  initializeBaseUrl,
  createUniqueTestUser,
  registerTestUser,
  getAuthenticatedAgent
};