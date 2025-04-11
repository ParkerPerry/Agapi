import request from 'supertest';
import { setupTestApp, closeTestApp } from '../../helpers/setup';
import { mockAuthentication } from '../../helpers/auth';
import { storage } from '../../../storage';
import { validateStatus, validateResponseAgainstSchema } from '../../helpers/validation';
import { followerResponseSchema } from '../../schemas/test-schemas';

describe('AI Followers API', () => {
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
    mockAuthentication(app);
  });

  describe('GET /api/followers', () => {
    it('should return user AI followers', async () => {
      // Mock the storage method
      storage.getAiFollowers = jest.fn().mockResolvedValue([
        { 
          id: 1, 
          name: 'TestBot', 
          personality: 'helpful assistant',
          userId: 1,
          createdAt: new Date().toISOString()
        }
      ]);

      const response = await request(app)
        .get('/api/followers');

      validateStatus(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id', 1);
      expect(response.body[0]).toHaveProperty('name', 'TestBot');
      
      // Validate response against schema
      response.body.forEach((follower: any) => {
        validateResponseAgainstSchema(follower, followerResponseSchema);
      });
    });

    it('should return an empty array when user has no followers', async () => {
      // Mock empty followers list
      storage.getAiFollowers = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get('/api/followers');

      validateStatus(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('POST /api/followers', () => {
    it('should create a new AI follower', async () => {
      const followerData = {
        name: 'NewBot',
        personality: 'creative and funny',
        avatarUrl: 'https://example.com/avatar.png'
      };

      storage.createAiFollower = jest.fn().mockResolvedValue({
        id: 2,
        ...followerData,
        userId: 1,
        createdAt: new Date().toISOString()
      });

      const response = await request(app)
        .post('/api/followers')
        .send(followerData);

      validateStatus(response, 201);
      expect(response.body).toHaveProperty('id', 2);
      expect(response.body).toHaveProperty('name', 'NewBot');
      expect(response.body).toHaveProperty('personality', 'creative and funny');
      
      // Validate response against schema
      validateResponseAgainstSchema(response.body, followerResponseSchema);
    });

    it('should return 400 for invalid follower data', async () => {
      // Send invalid data (missing required fields)
      const response = await request(app)
        .post('/api/followers')
        .send({
          // Missing required 'name' and 'personality'
          avatarUrl: 'https://example.com/avatar.png'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/followers/:id', () => {
    it('should return a specific AI follower', async () => {
      const followerId = 1;
      
      storage.getAiFollower = jest.fn().mockResolvedValue({
        id: followerId,
        name: 'SpecificBot',
        personality: 'helpful assistant',
        userId: 1,
        createdAt: new Date().toISOString()
      });

      const response = await request(app)
        .get(`/api/followers/${followerId}`);

      validateStatus(response, 200);
      expect(response.body).toHaveProperty('id', followerId);
      expect(response.body).toHaveProperty('name', 'SpecificBot');
      
      // Validate response against schema
      validateResponseAgainstSchema(response.body, followerResponseSchema);
    });

    it('should return 404 for non-existent follower', async () => {
      const nonExistentId = 999;
      
      storage.getAiFollower = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/followers/${nonExistentId}`);

      validateStatus(response, 404);
    });
  });

  describe('PATCH /api/followers/:id', () => {
    it('should update an AI follower', async () => {
      const followerId = 1;
      const updateData = {
        name: 'UpdatedBot',
        personality: 'updated personality'
      };
      
      storage.getAiFollower = jest.fn().mockResolvedValue({
        id: followerId,
        name: 'OriginalBot',
        personality: 'original personality',
        userId: 1,
        createdAt: new Date().toISOString()
      });
      
      storage.updateAiFollower = jest.fn().mockResolvedValue({
        id: followerId,
        name: 'UpdatedBot',
        personality: 'updated personality',
        userId: 1,
        createdAt: new Date().toISOString()
      });

      const response = await request(app)
        .patch(`/api/followers/${followerId}`)
        .send(updateData);

      validateStatus(response, 200);
      expect(response.body).toHaveProperty('id', followerId);
      expect(response.body).toHaveProperty('name', 'UpdatedBot');
      expect(response.body).toHaveProperty('personality', 'updated personality');
      
      // Validate response against schema
      validateResponseAgainstSchema(response.body, followerResponseSchema);
    });
  });
});