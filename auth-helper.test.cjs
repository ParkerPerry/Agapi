/**
 * Authentication helper for tests
 * This module provides utilities for testing authentication-related functionality
 */
const supertest = require('supertest');
const { z } = require('zod');

// Base URL for API requests
const BASE_URL = 'http://localhost:5000';

// Test user credentials
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
 * Attempts to register a new test user
 * @returns {Promise<Object>} The response from the registration attempt
 */
async function registerTestUser() {
  const request = supertest(BASE_URL);
  
  try {
    const response = await request
      .post('/api/auth/register')
      .send(TEST_USER);
    
    return response;
  } catch (error) {
    console.error('Error registering test user:', error);
    return { status: 500, body: null };
  }
}

/**
 * Attempts to log in with test user credentials
 * @returns {Promise<Object>} The agent with session cookies set
 */
async function loginTestUser() {
  const agent = supertest.agent(BASE_URL);
  
  try {
    // First try to register (in case the user doesn't exist)
    await registerTestUser();
    
    // Then try to login
    const loginResponse = await agent
      .post('/api/auth/login')
      .send({
        username: TEST_USER.username,
        password: TEST_USER.password
      });
    
    // Check if login was successful
    if (loginResponse.status === 200) {
      console.log('Test user login successful');
    } else {
      console.log('Test user login failed with status:', loginResponse.status);
    }
    
    return agent;
  } catch (error) {
    console.error('Error logging in test user:', error);
    return agent;
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

module.exports = {
  TEST_USER,
  userSchema,
  registerTestUser,
  loginTestUser,
  isAuthenticated
};