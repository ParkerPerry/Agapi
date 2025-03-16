import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import { Server } from 'http';
import type { Post, AIFollower } from '@shared/schema';

let app: express.Express;
let server: Server;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  server = await registerRoutes(app);
});

afterAll(async () => {
  return new Promise<void>((resolve) => {
    server.close(() => {
      resolve();
    });
  });
});

describe('API Routes', () => {
  describe('Authentication', () => {
    it('should return 401 for unauthorized requests', async () => {
      await request(app)
        .get('/api/posts/1')
        .expect(401);
    });
  });

  describe('Posts', () => {
    // Mock authenticated user session
    const mockSession = {
      passport: { user: { id: 1 } }
    };

    beforeEach(() => {
      // Mock isAuthenticated middleware
      app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
        (req as any).isAuthenticated = () => true;
        (req as any).user = mockSession.passport.user;
        next();
      });
    });

    it('should create a new post', async () => {
      const postContent = 'Test post content';

      // Mock storage methods
      storage.createPost = jest.fn().mockResolvedValue({
        id: 1,
        content: postContent,
        userId: 1,
        createdAt: new Date().toISOString()
      } as Post);

      storage.getAiFollowers = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .post('/api/posts')
        .send({ content: postContent })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        content: postContent,
        userId: 1
      });
    });

    it('should retrieve user posts with interactions', async () => {
      // Mock storage methods
      storage.getUserPosts = jest.fn().mockResolvedValue([{
        id: 1,
        content: 'Test post',
        userId: 1,
        createdAt: new Date().toISOString()
      }] as Post[]);

      storage.getPostInteractions = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get('/api/posts/1')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toMatchObject({
        id: expect.any(Number),
        content: expect.any(String),
        interactions: expect.any(Array)
      });
    });
  });

  describe('AI Followers', () => {
    beforeEach(() => {
      app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
        (req as any).isAuthenticated = () => true;
        (req as any).user = { id: 1 };
        next();
      });
    });

    it('should create a new AI follower', async () => {
      const followerData = {
        name: 'TestBot',
        personality: 'friendly tech enthusiast',
        avatarUrl: 'https://example.com/avatar.png'
      };

      storage.createAiFollower = jest.fn().mockResolvedValue({
        id: 1,
        ...followerData,
        userId: 1,
        createdAt: new Date().toISOString()
      } as AIFollower);

      const response = await request(app)
        .post('/api/followers')
        .send(followerData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: followerData.name,
        personality: followerData.personality
      });
    });

    it('should retrieve user\'s AI followers', async () => {
      storage.getAiFollowers = jest.fn().mockResolvedValue([{
        id: 1,
        name: 'TestBot',
        personality: 'friendly',
        userId: 1,
        createdAt: new Date().toISOString()
      }] as AIFollower[]);

      const response = await request(app)
        .get('/api/followers')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        personality: expect.any(String)
      });
    });
  });
});