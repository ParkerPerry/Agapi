const request = require('supertest');
const express = require('express');
const { registerRoutes } = require('../routes');
const { storage } = require('../storage');

let app;
let server;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  server = await registerRoutes(app);
});

afterAll(() => {
  return new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });
});

describe('Core Features', () => {
  describe('Login with Test1/test1', () => {
    it('should successfully login with correct credentials', async () => {
      storage.getUserByUsername = jest.fn().mockResolvedValue({
        id: 1,
        username: 'Test1',
        password: 'test1', // In real app this would be hashed
        createdAt: new Date().toISOString()
      });

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'Test1',
          password: 'test1'
        })
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('username', 'Test1');
    });
  });

  describe('Post Creation and AI Interaction', () => {
    const mockUser = { id: 1, username: 'Test1' };

    beforeEach(() => {
      app.use((req, _res, next) => {
        req.isAuthenticated = () => true;
        req.user = mockUser;
        next();
      });
    });

    it('should create a post and trigger AI responses', async () => {
      const postContent = 'Test post content';

      storage.createPost = jest.fn().mockResolvedValue({
        id: 1,
        content: postContent,
        userId: mockUser.id,
        createdAt: new Date().toISOString()
      });

      storage.getAiFollowers = jest.fn().mockResolvedValue([{
        id: 1,
        name: 'TestBot',
        personality: 'friendly',
        userId: mockUser.id
      }]);

      storage.createAiInteraction = jest.fn().mockResolvedValue({
        id: 1,
        postId: 1,
        aiFollowerId: 1,
        type: 'comment',
        content: 'Test AI response',
        parentId: null,
        createdAt: new Date().toISOString()
      });

      const response = await request(app)
        .post('/api/posts')
        .send({ content: postContent })
        .expect(201);

      expect(response.body).toMatchObject({
        id: 1,
        content: postContent,
        userId: mockUser.id
      });

      expect(storage.createAiInteraction).toHaveBeenCalled();
    });

    it('should handle replies to AI followers', async () => {
      const replyContent = 'Test reply content';

      storage.getInteraction = jest.fn().mockResolvedValue({
        id: 1,
        postId: 1,
        aiFollowerId: 1,
        type: 'comment',
        content: 'Original AI comment',
        parentId: null,
        createdAt: new Date().toISOString()
      });

      storage.getAiFollower = jest.fn().mockResolvedValue({
        id: 1,
        name: 'TestBot',
        personality: 'friendly',
        userId: mockUser.id
      });

      storage.createAiInteraction = jest.fn().mockResolvedValue({
        id: 2,
        postId: 1,
        aiFollowerId: 1,
        type: 'reply',
        content: replyContent,
        parentId: 1,
        createdAt: new Date().toISOString()
      });

      const response = await request(app)
        .post('/api/posts/1/reply')
        .send({
          content: replyContent,
          parentId: 1
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content');
      expect(storage.createAiInteraction).toHaveBeenCalled();
    });
  });
});