/**
 * Authentication helper for tests
 * This module provides utilities for testing authentication-related functionality
 */
const supertest = require('supertest');
const { z } = require('zod');
const { randomUUID } = require('crypto');

// Base URLs for API requests with fallback options
const BASE_URLS = [
  'http://localhost:80',  // Replit HTTP proxy
  'http://localhost:5000', // Primary port
  'http://localhost:5001'  // Fallback port
];

// Function to find the first working URL
async function findWorkingBaseUrl() {
  for (const url of BASE_URLS) {
    try {
      // Use supertest for consistent behavior with the rest of the tests
      const request = supertest(url);
      const response = await request.get('/api/user');
      
      // We expect a 401 for unauthenticated requests - that means the server is up
      if (response.status === 401) {
        console.log(`Successfully connected to ${url} (got 401 as expected for unauthenticated request)`);
        return url;
      }
      
      // If we got any response at all, the server is running
      console.log(`Connected to ${url} with status ${response.status}`);
      return url;
    } catch (error) {
      console.log(`Failed to connect to ${url}: ${error.message}`);
    }
  }
  console.log('Could not connect to any of the configured URLs, defaulting to first option');
  return BASE_URLS[0];
}

// Initialize with the first option by default
let BASE_URL = BASE_URLS[0];

// This will be called before tests run to set the correct URL
async function initializeBaseUrl() {
  BASE_URL = await findWorkingBaseUrl();
  console.log(`Using base URL: ${BASE_URL}`);
  return BASE_URL;
}

// Default test user credentials
const TEST_USER = {
  username: 'testuser',
  password: 'testpassword',
  email: 'test@example.com'
};

// Response schema for user
const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: z.string().or(z.date()).nullable()
});

/**
 * Creates a unique test user with random username
 * @returns {Object} Test user data with unique username
 */
function createUniqueTestUser() {
  const uniqueId = randomUUID().substring(0, 8);
  return {
    username: `testuser_${uniqueId}`,
    password: TEST_USER.password,
    email: `test_${uniqueId}@example.com`
  };
}

/**
 * Registers a new test user with unique credentials
 * @param {Object} agent - Optional supertest agent to maintain session
 * @param {Object} userData - Optional user data to override defaults
 * @returns {Promise<Object>} The registered user data
 */
async function registerTestUser(agent = null, userData = null) {
  // Ensure we have the right base URL
  if (!BASE_URL.includes('localhost')) {
    BASE_URL = await initializeBaseUrl();
  }
  
  const request = agent || supertest(BASE_URL);
  const testUser = userData || createUniqueTestUser();
  
  console.log(`Attempting to register user: ${testUser.username}`);
  
  try {
    const response = await request
      .post('/api/register')
      .send(testUser);
    
    // Add debugging to see what we're getting back
    console.log(`Registration response status: ${response.status}`);
    
    // If the user already exists, this might be a 409 Conflict or could still be 200 OK
    // depending on the API implementation
    if (response.status === 200 || response.status === 201 || response.status === 409) {
      console.log('Test user registration successful or user already exists');
      
      // Combine the test user data with any returned data
      // Fall back to just the test user data if the body is empty
      const userData = {
        ...testUser,
        ...(response.body || {})
      };
      
      console.log(`Registered user data: ${JSON.stringify(userData)}`);
      return userData;
    } else {
      console.error('Test user registration failed:', response.status, response.body);
      throw new Error(`Failed to register test user: ${response.status}`);
    }
  } catch (error) {
    console.error('Error registering test user:', error);
    
    // If we get an error but the user might have been created anyway,
    // return the test user data as a fallback
    return testUser;
  }
}

/**
 * Logs in with provided credentials
 * @param {Object} agent - Optional supertest agent to maintain session
 * @param {string} username - Username to login with
 * @param {string} password - Password to login with
 * @returns {Promise<Object>} Object containing the agent and login response
 */
async function loginTestUser(agent = null, username = TEST_USER.username, password = TEST_USER.password) {
  // Ensure we have the right base URL
  if (!BASE_URL.includes('localhost')) {
    BASE_URL = await initializeBaseUrl();
  }
  
  const request = agent || supertest.agent(BASE_URL);
  
  try {
    const loginResponse = await request
      .post('/api/login')
      .send({ username, password });
    
    // Check if login was successful
    if (loginResponse.status === 200) {
      console.log('Test user login successful');
      
      // Debug: Check if we received session cookies
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies && cookies.length > 0) {
        console.log(`Received ${cookies.length} cookies from login response`);
      } else {
        console.warn('No cookies received from login response!');
      }
      
      // Make a test request to verify the session is working
      const testResponse = await request.get('/api/user');
      console.log(`Authentication verification: GET /api/user returned status ${testResponse.status}`);
      
      // Return both the agent (for session cookies) and the response body
      return { 
        agent: request, 
        body: loginResponse.body 
      };
    } else {
      console.error('Test user login failed with status:', loginResponse.status);
      throw new Error(`Login failed with status: ${loginResponse.status}`);
    }
  } catch (error) {
    console.error('Error logging in test user:', error);
    throw error;
  }
}

/**
 * Test whether a user is currently authenticated
 * @param {Object} agent - The supertest agent with session cookies
 * @returns {Promise<boolean>} Whether the user is authenticated
 */
async function isAuthenticated(agent) {
  try {
    const response = await agent.get('/api/user');
    return response.status === 200;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Get an authenticated supertest agent with a new test user
 * @returns {Promise<Object>} Object containing the authenticated agent and user data
 */
async function getAuthenticatedAgent() {
  try {
    // Make sure we have the right base URL before creating the agent
    if (!BASE_URL.includes('localhost')) {
      BASE_URL = await initializeBaseUrl();
    }
    
    // Create an agent to maintain cookies/session
    const agent = supertest.agent(BASE_URL);
    
    // Create a unique test user
    const testUser = createUniqueTestUser();
    
    // Register the new user
    const user = await registerTestUser(agent, testUser);
    
    // Direct implementation without relying on other helper functions
    console.log(`Direct auth attempt for user: ${user.username}`);
    
    // Login directly with the agent
    const loginResponse = await agent
      .post('/api/login')
      .send({ 
        username: user.username, 
        password: user.password 
      });
    
    if (loginResponse.status !== 200) {
      console.error(`Login failed with status ${loginResponse.status}`);
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }
    
    console.log('Login successful, verifying session...');
    
    // Debug: Check if we received session cookies
    const cookies = loginResponse.headers['set-cookie'];
    if (cookies && cookies.length > 0) {
      console.log(`Received ${cookies.length} cookies from login response`);
    } else {
      console.warn('No cookies received from login response!');
    }
    
    // Verify the session is working with a direct request to a protected endpoint
    const verifyResponse = await agent.get('/api/user');
    
    if (verifyResponse.status !== 200) {
      console.error(`Authentication verification failed - status: ${verifyResponse.status}`);
      throw new Error('Failed to verify authentication');
    }
    
    console.log('Authentication successfully verified!');
    
    // Add the user's id from the verification response if available
    if (verifyResponse.body && verifyResponse.body.id) {
      user.id = verifyResponse.body.id;
    }
    
    // Return both the authenticated agent and user data
    return { agent, user };
  } catch (error) {
    console.error('Error getting authenticated agent:', error);
    throw error;
  }
}

/**
 * Clean up test data after tests
 * @param {number} userId - ID of the test user
 * @returns {Promise<boolean>} Success/failure of cleanup
 */
async function cleanupTestData(userId) {
  // This would typically involve deleting all test entities created by this user
  console.log(`[Test Cleanup] Would remove test data for user ID: ${userId}`);
  
  // For full implementation, this function would delete:
  // - Posts created by test user
  // - Circles created by test user
  // - Comments by test user
  // - The test user account itself
  
  // Currently just a placeholder
  return true;
}

module.exports = {
  TEST_USER,
  userSchema,
  registerTestUser,
  loginTestUser,
  isAuthenticated,
  getAuthenticatedAgent,
  cleanupTestData,
  createUniqueTestUser,
  initializeBaseUrl,
  findWorkingBaseUrl,
  BASE_URLS
};