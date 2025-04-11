/**
 * Authentication helper for tests
 * This module provides utilities for testing authentication-related functionality
 */
const supertest = require('supertest');
const { z } = require('zod');
const { randomUUID } = require('crypto');

// Base URL for API requests
const BASE_URL = 'http://localhost:5000';

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
  const request = agent || supertest(BASE_URL);
  const testUser = userData || createUniqueTestUser();
  
  try {
    const response = await request
      .post('/api/auth/register')
      .send(testUser);
    
    if (response.status === 200) {
      console.log('Test user registration successful');
      return {
        ...testUser,
        ...response.body
      };
    } else {
      console.error('Test user registration failed:', response.status, response.body);
      throw new Error(`Failed to register test user: ${response.status}`);
    }
  } catch (error) {
    console.error('Error registering test user:', error);
    throw error;
  }
}

/**
 * Logs in with provided credentials
 * @param {Object} agent - Optional supertest agent to maintain session
 * @param {string} username - Username to login with
 * @param {string} password - Password to login with
 * @returns {Promise<Object>} Login response data
 */
async function loginTestUser(agent = null, username = TEST_USER.username, password = TEST_USER.password) {
  const request = agent || supertest(BASE_URL);
  
  try {
    const loginResponse = await request
      .post('/api/auth/login')
      .send({ username, password });
    
    // Check if login was successful
    if (loginResponse.status === 200) {
      console.log('Test user login successful');
      return loginResponse.body;
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
    // Create an agent to maintain cookies/session
    const agent = supertest.agent(BASE_URL);
    
    // Create a unique test user
    const testUser = createUniqueTestUser();
    
    // Register the new user
    const user = await registerTestUser(agent, testUser);
    
    // Log in with the new user
    await loginTestUser(agent, user.username, user.password);
    
    // Verify authentication succeeded
    const authenticated = await isAuthenticated(agent);
    if (!authenticated) {
      throw new Error('Failed to authenticate test user');
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
  createUniqueTestUser
};