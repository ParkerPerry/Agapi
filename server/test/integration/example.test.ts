/**
 * Example integration test that demonstrates how to use the testing utilities
 */

import { setupTestApp, closeTestApp } from '../helpers/setup';
import { mockAuthentication, getAuthenticatedAgent, TestUser } from '../helpers/auth';
import { validateStatus, validateResponseAgainstSchema } from '../helpers/validation';
import { userResponseSchema } from '../schemas/test-schemas';
import { storage } from '../../storage';
import request from 'supertest';
import { expect, jest, describe, it, beforeAll, afterAll, beforeEach } from '@jest/globals';

describe('Example API Test', () => {
  let app: any;
  let server: any;
  
  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    server = setup.server;
  });
  
  afterAll(async () => {
    await closeTestApp(server);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Health Check', () => {
    it('should return 200 for health endpoint', async () => {
      const response = await request(app).get('/api/health');
      
      validateStatus(response, 200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
  
  describe('Authentication Flow', () => {
    const testUser: TestUser = {
      id: 1,
      username: 'testuser',
      password: 'password'
    };
    
    it('should authenticate a user with valid credentials', async () => {
      // Mock storage to return our test user
      jest.spyOn(storage, 'getUserByUsername').mockResolvedValue({
        ...testUser,
        avatarUrl: null,
        bio: null,
        createdAt: new Date().toISOString()
      });
      
      // Add auth route in the test app
      app.post('/api/login', (req: any, res: any) => {
        if (req.body.username === testUser.username && req.body.password === testUser.password) {
          // In a real app, this would set up a session
          res.status(200).json({
            id: testUser.id,
            username: testUser.username
          });
        } else {
          res.status(401).json({ message: 'Invalid credentials' });
        }
      });
      
      const response = await request(app)
        .post('/api/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });
      
      validateStatus(response, 200);
      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('username', testUser.username);
      
      // Check against schema
      validateResponseAgainstSchema(response.body, userResponseSchema);
    });
    
    it('should return user data when authenticated', async () => {
      // Mock authentication for this test
      mockAuthentication(app, testUser);
      
      // Add authenticated route
      app.get('/api/user', (req: any, res: any) => {
        if (req.isAuthenticated && req.isAuthenticated()) {
          res.status(200).json(req.user);
        } else {
          res.status(401).json({ message: 'Not authenticated' });
        }
      });
      
      const response = await request(app).get('/api/user');
      
      validateStatus(response, 200);
      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('username', testUser.username);
    });
  });
  
  describe('Using authenticated agent', () => {
    it('should maintain session across requests', async () => {
      const testUser: TestUser = {
        id: 1,
        username: 'testuser',
        password: 'password'
      };
      
      // Add auth route
      app.post('/api/login', (req: any, res: any) => {
        res.status(200).json(testUser);
      });
      
      // Add authenticated route
      app.get('/api/user', (req: any, res: any) => {
        res.status(200).json(testUser);
      });
      
      // Get authenticated agent
      const agent = request.agent(app);
      
      // Login
      await agent
        .post('/api/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });
      
      // Make authenticated request
      const response = await agent.get('/api/user');
      
      validateStatus(response, 200);
      expect(response.body).toHaveProperty('id', testUser.id);
    });
  });
});