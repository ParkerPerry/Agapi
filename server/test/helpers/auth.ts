import request from 'supertest';
import { Express } from 'express';
import { storage } from '../../storage';

/**
 * User interface for testing
 */
export interface TestUser {
  id: number;
  username: string;
  password?: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

/**
 * Create a supertest agent with authenticated session
 * @param {Express} app - Express application
 * @param {TestUser} user - Test user for authentication
 * @returns {Promise<request.SuperTest<request.Test>>} Authenticated agent
 */
export async function getAuthenticatedAgent(app: Express, user: TestUser): Promise<request.SuperTest<request.Test>> {
  const agent = request.agent(app);
  
  // Mock storage to provide user for login
  storage.getUserByUsername = jest.fn().mockResolvedValue({
    ...user,
    password: user.password || 'hashedpassword'
  });
  
  // Mock password comparison to always succeed in tests
  jest.mock('../../auth', () => ({
    comparePasswords: jest.fn().mockResolvedValue(true)
  }));
  
  // Login to get a session
  await agent
    .post('/api/login')
    .send({
      username: user.username,
      password: user.password || 'password'
    });
  
  return agent;
}

/**
 * Mock authentication middleware for testing
 * This adds user object to request without the need for actual authentication
 * @param {Express} app - Express application
 * @param {TestUser} user - Test user to inject
 */
export function mockAuthentication(app: Express, user: TestUser = { id: 1, username: 'testuser' }): void {
  app.use((req: any, _res: any, next: any) => {
    req.isAuthenticated = () => true;
    req.user = user;
    next();
  });
}

/**
 * Create a test user in the database
 * @param {Partial<TestUser>} userData - User data
 * @returns {Promise<TestUser>} Created test user
 */
export async function createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
  const defaultUser = {
    username: `test_${Math.random().toString(36).substring(2, 10)}`,
    password: 'password',
    avatarUrl: null,
    createdAt: new Date().toISOString()
  };
  
  const userToCreate = {
    ...defaultUser,
    ...userData
  };
  
  // Mock user creation
  const createdUser = {
    id: 1,
    ...userToCreate
  };
  
  storage.createUser = jest.fn().mockResolvedValue(createdUser);
  
  return createdUser;
}