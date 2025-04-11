/**
 * Integration tests for Circles API
 */

import { setupTestApp, closeTestApp } from '../../helpers/setup';
import { mockAuthentication, TestUser } from '../../helpers/auth';
import { validateStatus, validateResponseAgainstSchema } from '../../helpers/validation';
import { storage } from '../../../storage';
import { createTestCircle, createTestUser } from '../../helpers/test-factories';
import { circleResponseSchema, circleListResponseSchema } from '../../schemas/test-schemas';
import request from 'supertest';
import { expect, jest, describe, it, beforeAll, afterAll, beforeEach } from '@jest/globals';

describe('Circles API', () => {
  let app: any;
  let server: any;
  
  // Test user for authentication
  const testUser: TestUser = {
    id: 1,
    username: 'circletest_user',
    bio: 'Test user for circle API tests'
  };
  
  // Setup before tests
  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    server = setup.server;
    
    // Mock authentication for all tests
    mockAuthentication(app, testUser);
  });
  
  // Cleanup after tests
  afterAll(async () => {
    await closeTestApp(server);
  });
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/circles', () => {
    it('should return a list of circles for the user', async () => {
      // Mock the storage response
      const testCircles = [
        createTestCircle({ id: 1, name: 'Test Circle 1', userId: testUser.id }),
        createTestCircle({ id: 2, name: 'Test Circle 2', userId: testUser.id })
      ];
      
      jest.spyOn(storage, 'getCircles').mockResolvedValue(testCircles);
      
      // Make request
      const response = await request(app).get('/api/circles');
      
      // Validate response
      validateStatus(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      // Validate against schema
      validateResponseAgainstSchema(response.body, circleListResponseSchema);
      
      // Check specific circle data
      expect(response.body[0].name).toBe('Test Circle 1');
      expect(response.body[1].name).toBe('Test Circle 2');
    });
    
    it('should handle errors from storage layer', async () => {
      // Mock a storage error
      jest.spyOn(storage, 'getCircles').mockRejectedValue(new Error('Storage error'));
      
      // Make request
      const response = await request(app).get('/api/circles');
      
      // Validate error response
      validateStatus(response, 500);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/circles', () => {
    it('should create a new circle', async () => {
      // Test circle data
      const circleData = {
        name: 'New Test Circle',
        description: 'Created in test',
        visibility: 'private'
      };
      
      // Mock the createCircle method
      const createdCircle = createTestCircle({
        id: 3,
        ...circleData,
        userId: testUser.id
      });
      
      jest.spyOn(storage, 'createCircle').mockResolvedValue(createdCircle);
      
      // Make request
      const response = await request(app)
        .post('/api/circles')
        .send(circleData);
      
      // Validate response
      validateStatus(response, 201);
      validateResponseAgainstSchema(response.body, circleResponseSchema);
      
      // Check if createCircle was called with correct data
      expect(storage.createCircle).toHaveBeenCalledWith(
        expect.objectContaining({
          name: circleData.name,
          description: circleData.description,
          userId: testUser.id
        })
      );
      
      // Check circle data
      expect(response.body).toHaveProperty('id', 3);
      expect(response.body).toHaveProperty('name', 'New Test Circle');
    });
    
    it('should return 400 for invalid circle data', async () => {
      // Invalid data (missing name)
      const invalidData = {
        description: 'Invalid circle data',
        visibility: 'private' 
      };
      
      // Make request
      const response = await request(app)
        .post('/api/circles')
        .send(invalidData);
      
      // Validate error response
      validateStatus(response, 400);
      expect(response.body).toHaveProperty('message');
      expect(storage.createCircle).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/circles/:id', () => {
    it('should return a specific circle by ID', async () => {
      // Mock circle data
      const testCircle = createTestCircle({
        id: 4,
        name: 'Test Circle 4',
        userId: testUser.id
      });
      
      // Mock storage methods
      jest.spyOn(storage, 'getCircleById').mockResolvedValue(testCircle);
      jest.spyOn(storage, 'hasCirclePermission').mockResolvedValue(true);
      
      // Make request
      const response = await request(app).get('/api/circles/4');
      
      // Validate response
      validateStatus(response, 200);
      validateResponseAgainstSchema(response.body, circleResponseSchema);
      
      // Check circle data
      expect(response.body).toHaveProperty('id', 4);
      expect(response.body).toHaveProperty('name', 'Test Circle 4');
    });
    
    it('should return 404 for non-existent circle', async () => {
      // Mock storage to return null
      jest.spyOn(storage, 'getCircleById').mockResolvedValue(null);
      
      // Make request
      const response = await request(app).get('/api/circles/999');
      
      // Validate error response
      validateStatus(response, 404);
      expect(response.body).toHaveProperty('message');
    });
    
    it('should return 403 if user has no permission to access the circle', async () => {
      // Mock circle owned by another user
      const otherUserCircle = createTestCircle({
        id: 5,
        name: 'Other User Circle',
        userId: 999 // Different user
      });
      
      // Mock storage methods
      jest.spyOn(storage, 'getCircleById').mockResolvedValue(otherUserCircle);
      jest.spyOn(storage, 'hasCirclePermission').mockResolvedValue(false);
      
      // Make request
      const response = await request(app).get('/api/circles/5');
      
      // Validate error response
      validateStatus(response, 403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('PATCH /api/circles/:id', () => {
    it('should update a circle', async () => {
      // Mock existing circle
      const existingCircle = createTestCircle({
        id: 6,
        name: 'Circle To Update',
        userId: testUser.id
      });
      
      // Update data
      const updateData = {
        name: 'Updated Circle Name',
        description: 'Updated description'
      };
      
      // Mock updated circle
      const updatedCircle = {
        ...existingCircle,
        ...updateData
      };
      
      // Mock storage methods
      jest.spyOn(storage, 'getCircleById').mockResolvedValue(existingCircle);
      jest.spyOn(storage, 'hasCirclePermission').mockResolvedValue(true);
      jest.spyOn(storage, 'updateCircle').mockResolvedValue(updatedCircle);
      
      // Make request
      const response = await request(app)
        .patch('/api/circles/6')
        .send(updateData);
      
      // Validate response
      validateStatus(response, 200);
      validateResponseAgainstSchema(response.body, circleResponseSchema);
      
      // Check updated data
      expect(response.body).toHaveProperty('id', 6);
      expect(response.body).toHaveProperty('name', 'Updated Circle Name');
      expect(response.body).toHaveProperty('description', 'Updated description');
      
      // Check if updateCircle was called with correct data
      expect(storage.updateCircle).toHaveBeenCalledWith(
        6,
        expect.objectContaining(updateData)
      );
    });
    
    it('should return 403 if user has no permission to update the circle', async () => {
      // Mock circle owned by another user
      const otherUserCircle = createTestCircle({
        id: 7,
        name: 'Other User Circle',
        userId: 999 // Different user
      });
      
      // Update data
      const updateData = {
        name: 'Attempt to Update',
      };
      
      // Mock storage methods
      jest.spyOn(storage, 'getCircleById').mockResolvedValue(otherUserCircle);
      jest.spyOn(storage, 'hasCirclePermission').mockResolvedValue(false);
      
      // Make request
      const response = await request(app)
        .patch('/api/circles/7')
        .send(updateData);
      
      // Validate error response
      validateStatus(response, 403);
      expect(response.body).toHaveProperty('message');
      expect(storage.updateCircle).not.toHaveBeenCalled();
    });
  });
  
  describe('DELETE /api/circles/:id', () => {
    it('should delete a circle', async () => {
      // Mock existing circle
      const existingCircle = createTestCircle({
        id: 8,
        name: 'Circle To Delete',
        userId: testUser.id
      });
      
      // Mock storage methods
      jest.spyOn(storage, 'getCircleById').mockResolvedValue(existingCircle);
      jest.spyOn(storage, 'hasCirclePermission').mockResolvedValue(true);
      jest.spyOn(storage, 'deleteCircle').mockResolvedValue(true);
      
      // Make request
      const response = await request(app).delete('/api/circles/8');
      
      // Validate response
      validateStatus(response, 200);
      expect(response.body).toHaveProperty('success', true);
      
      // Verify deleteCircle was called
      expect(storage.deleteCircle).toHaveBeenCalledWith(8);
    });
    
    it('should return 403 if user has no permission to delete the circle', async () => {
      // Mock circle owned by another user
      const otherUserCircle = createTestCircle({
        id: 9,
        name: 'Other User Circle',
        userId: 999 // Different user
      });
      
      // Mock storage methods
      jest.spyOn(storage, 'getCircleById').mockResolvedValue(otherUserCircle);
      jest.spyOn(storage, 'hasCirclePermission').mockResolvedValue(false);
      
      // Make request
      const response = await request(app).delete('/api/circles/9');
      
      // Validate error response
      validateStatus(response, 403);
      expect(response.body).toHaveProperty('message');
      expect(storage.deleteCircle).not.toHaveBeenCalled();
    });
  });
});