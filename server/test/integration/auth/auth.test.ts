/**
 * Integration tests for authentication endpoints
 */

import { Express } from 'express';
import { Server } from 'http';
import request from 'supertest';
import { beforeAll, afterAll, beforeEach, afterEach, describe, it, expect } from '@jest/globals';

import { setupTestApp, closeTestApp, resetAppState } from '../../helpers/setup';
import { createTestUser } from '../../helpers/test-factories';
import { authenticateRequest } from '../../helpers/auth';
import { validateStatus, validateResponseAgainstSchema } from '../../helpers/validation';
import { userResponseSchema } from '../../schemas/test-schemas';

describe('Authentication API Integration Tests', () => {
  let app: Express;
  let server: Server;
  
  beforeAll(async () => {
    // Set up the test environment
    const testEnv = await setupTestApp();
    app = testEnv.app;
    server = testEnv.server;
  });
  
  afterAll(async () => {
    // Clean up the test environment
    await closeTestApp(server);
  });
  
  beforeEach(() => {
    // Reset test state before each test
    resetAppState();
    
    // Set up test data
    const testUser = createTestUser();
    global.testEnv.mockStorage.users = [testUser];
  });
  
  afterEach(() => {
    // Clean up after each test
    global.testEnv.mockStorage.users = [];
  });
  
  describe('POST /api/auth/login', () => {
    it('should authenticate a user with valid credentials', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assert
      validateStatus(response, 200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', 'testuser');
      validateResponseAgainstSchema(response.body, userResponseSchema);
    });
    
    it('should return 401 with invalid credentials', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assert
      validateStatus(response, 401);
      expect(response.body).toHaveProperty('message');
    });
    
    it('should return 400 with missing credentials', async () => {
      // Arrange
      const loginData = {
        username: 'testuser'
        // Missing password
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assert
      validateStatus(response, 400);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // Arrange
      const registerData = {
        username: 'newuser',
        password: 'newpassword123'
      };
      
      // Mock the storage to "create" a user
      jest.spyOn(global.testEnv.mockStorage, 'createUser').mockImplementation(async (userData) => {
        return {
          id: 2,
          username: userData.username,
          password: 'hashed_password',
          avatarUrl: null,
          bio: null,
          createdAt: new Date()
        };
      });
      
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);
      
      // Assert
      validateStatus(response, 201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', 'newuser');
      validateResponseAgainstSchema(response.body, userResponseSchema);
    });
    
    it('should return 400 with invalid registration data', async () => {
      // Arrange
      const registerData = {
        username: '',  // Invalid username
        password: 'newpassword123'
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);
      
      // Assert
      validateStatus(response, 400);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/auth/me', () => {
    it('should return the current user when authenticated', async () => {
      // Arrange
      const agent = request.agent(app);
      await authenticateRequest(agent, 'testuser', 'password123');
      
      // Act
      const response = await agent.get('/api/auth/me');
      
      // Assert
      validateStatus(response, 200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', 'testuser');
      validateResponseAgainstSchema(response.body, userResponseSchema);
    });
    
    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app).get('/api/auth/me');
      
      // Assert
      validateStatus(response, 401);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/auth/logout', () => {
    it('should log out the current user', async () => {
      // Arrange
      const agent = request.agent(app);
      await authenticateRequest(agent, 'testuser', 'password123');
      
      // Act
      const response = await agent.post('/api/auth/logout');
      
      // Assert
      validateStatus(response, 200);
      expect(response.body).toHaveProperty('message');
      
      // Verify user is logged out by attempting to access protected endpoint
      const meResponse = await agent.get('/api/auth/me');
      validateStatus(meResponse, 401);
    });
  });
});