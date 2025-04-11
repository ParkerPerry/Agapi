import request from 'supertest';
import { setupTestApp, closeTestApp } from '../../helpers/setup';
import { mockAuthentication } from '../../helpers/auth';
import { storage } from '../../../storage';
import { validateStatus, validateResponseAgainstSchema } from '../../helpers/validation';
import { postResponseSchema } from '../../schemas/test-schemas';

describe('Posts API', () => {
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
    mockAuthentication(app, { id: 1, username: 'testuser' });
  });

  describe('GET /api/posts', () => {
    it('should return user posts', async () => {
      // Mock user posts
      storage.getUserPosts = jest.fn().mockResolvedValue([
        {
          id: 1,
          content: 'Test post content',
          userId: 1,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          content: 'Another test post',
          userId: 1,
          createdAt: new Date().toISOString()
        }
      ]);
      
      // Mock post interactions
      storage.getPostInteractions = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get('/api/posts');

      validateStatus(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      // Basic assertions for each post
      response.body.forEach((post: any) => {
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('content');
        expect(post).toHaveProperty('userId', 1);
        expect(post).toHaveProperty('interactions');
        expect(Array.isArray(post.interactions)).toBe(true);
      });
      
      // Validate first post against schema
      validateResponseAgainstSchema(response.body[0], postResponseSchema);
    });

    it('should return empty array when user has no posts', async () => {
      // Mock empty posts
      storage.getUserPosts = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get('/api/posts');

      validateStatus(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const postContent = 'New test post content';
      
      // Mock post creation
      storage.createPost = jest.fn().mockResolvedValue({
        id: 3,
        content: postContent,
        userId: 1,
        createdAt: new Date().toISOString()
      });
      
      // Mock AI followers retrieval for response generation
      storage.getAiFollowers = jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'TestBot',
          personality: 'helpful',
          userId: 1
        }
      ]);
      
      // Mock interaction creation
      storage.createAiInteraction = jest.fn().mockResolvedValue({
        id: 1,
        postId: 3,
        userId: 1,
        aiFollowerId: 1,
        type: 'comment',
        content: 'AI response',
        createdAt: new Date().toISOString()
      });

      const response = await request(app)
        .post('/api/posts')
        .send({ content: postContent });

      validateStatus(response, 201);
      expect(response.body).toHaveProperty('id', 3);
      expect(response.body).toHaveProperty('content', postContent);
      expect(response.body).toHaveProperty('userId', 1);
      
      // Validate response against schema
      validateResponseAgainstSchema(response.body, postResponseSchema);
    });

    it('should return 400 for empty post content', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({ content: '' });

      validateStatus(response, 400);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should return a specific post with interactions', async () => {
      const postId = 1;
      
      // Mock post retrieval
      storage.getPost = jest.fn().mockResolvedValue({
        id: postId,
        content: 'Specific post content',
        userId: 1,
        createdAt: new Date().toISOString()
      });
      
      // Mock interactions retrieval
      storage.getPostInteractions = jest.fn().mockResolvedValue([
        {
          id: 1,
          postId,
          userId: 1,
          aiFollowerId: 1,
          type: 'comment',
          content: 'AI comment on post',
          createdAt: new Date().toISOString()
        }
      ]);

      const response = await request(app)
        .get(`/api/posts/${postId}`);

      validateStatus(response, 200);
      expect(response.body).toHaveProperty('id', postId);
      expect(response.body).toHaveProperty('content', 'Specific post content');
      expect(response.body).toHaveProperty('interactions');
      expect(Array.isArray(response.body.interactions)).toBe(true);
      expect(response.body.interactions.length).toBe(1);
      
      // Validate response against schema
      validateResponseAgainstSchema(response.body, postResponseSchema);
    });

    it('should return 404 for non-existent post', async () => {
      const nonExistentId = 999;
      
      // Mock post not found
      storage.getPost = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/posts/${nonExistentId}`);

      validateStatus(response, 404);
    });
  });

  describe('POST /api/posts/:id/reply', () => {
    it('should create a reply to a post', async () => {
      const postId = 1;
      const replyContent = 'This is a reply to the post';
      const parentId = 1; // ID of the parent interaction
      
      // Mock post retrieval
      storage.getPost = jest.fn().mockResolvedValue({
        id: postId,
        content: 'Original post content',
        userId: 1,
        createdAt: new Date().toISOString()
      });
      
      // Mock parent interaction retrieval
      storage.getInteraction = jest.fn().mockResolvedValue({
        id: parentId,
        postId,
        userId: 2, // Different user for the parent comment
        aiFollowerId: 1,
        type: 'comment',
        content: 'Original comment',
        createdAt: new Date().toISOString()
      });
      
      // Mock AI follower retrieval
      storage.getAiFollower = jest.fn().mockResolvedValue({
        id: 1,
        name: 'TestBot',
        personality: 'helpful',
        userId: 1
      });
      
      // Mock reply creation
      storage.createAiInteraction = jest.fn().mockResolvedValue({
        id: 2,
        postId,
        userId: 1,
        aiFollowerId: 1,
        type: 'reply',
        parentId,
        content: replyContent,
        createdAt: new Date().toISOString()
      });

      const response = await request(app)
        .post(`/api/posts/${postId}/reply`)
        .send({ 
          content: replyContent,
          parentId
        });

      validateStatus(response, 201);
      expect(response.body).toHaveProperty('id', 2);
      expect(response.body).toHaveProperty('type', 'reply');
      expect(response.body).toHaveProperty('content', replyContent);
      expect(response.body).toHaveProperty('parentId', parentId);
    });

    it('should return 404 when parent post does not exist', async () => {
      const nonExistentPostId = 999;
      
      // Mock post not found
      storage.getPost = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/posts/${nonExistentPostId}/reply`)
        .send({ 
          content: 'Reply to non-existent post',
          parentId: 1
        });

      validateStatus(response, 404);
    });

    it('should return 404 when parent interaction does not exist', async () => {
      const postId = 1;
      const nonExistentParentId = 999;
      
      // Mock post retrieval
      storage.getPost = jest.fn().mockResolvedValue({
        id: postId,
        content: 'Original post content',
        userId: 1,
        createdAt: new Date().toISOString()
      });
      
      // Mock parent interaction not found
      storage.getInteraction = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/posts/${postId}/reply`)
        .send({ 
          content: 'Reply to non-existent parent',
          parentId: nonExistentParentId
        });

      validateStatus(response, 404);
    });
  });
});