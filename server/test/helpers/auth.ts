/**
 * Authentication helpers for tests
 */

import { SuperAgentTest } from 'supertest';

/**
 * Authenticate a request
 * @param {SuperAgentTest} agent - SuperTest agent to authenticate
 * @param {string} username - Username to authenticate with
 * @param {string} password - Password to authenticate with
 * @returns {Promise<SuperAgentTest>} - Authenticated supertest agent
 */
export async function authenticateRequest(
  agent: SuperAgentTest,
  username: string, 
  password: string
): Promise<SuperAgentTest> {
  await agent
    .post('/api/auth/login')
    .send({ username, password });
  
  return agent;
}

/**
 * Create a mock session for testing
 * @param {number} userId - User ID to create session for
 * @returns {object} - Mock session object
 */
export function createMockSession(userId: number): any {
  return {
    passport: {
      user: userId
    }
  };
}

/**
 * Create mock authenticated request object
 * @param {number} userId - User ID to authenticate as
 * @returns {object} - Mock request object
 */
export function createAuthenticatedRequest(userId: number): any {
  return {
    isAuthenticated: () => true,
    user: { id: userId },
    session: createMockSession(userId)
  };
}

/**
 * Create mock unauthenticated request object
 * @returns {object} - Mock request object
 */
export function createUnauthenticatedRequest(): any {
  return {
    isAuthenticated: () => false,
    user: null,
    session: {}
  };
}