/**
 * Tests for simplified mock storage
 */

import { SimpleMockStorage } from './mock-storage';

describe('SimpleMockStorage', () => {
  let storage: SimpleMockStorage;
  
  beforeEach(() => {
    storage = new SimpleMockStorage();
  });
  
  describe('User Operations', () => {
    test('createUser should add a user and return it with an ID', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Test user',
        createdAt: new Date()
      };
      
      const user = await storage.createUser(userData);
      
      expect(user).toEqual({
        ...userData,
        id: 1
      });
      
      const retrievedUser = await storage.getUser(1);
      expect(retrievedUser).toEqual(user);
    });
    
    test('getUserByUsername should retrieve a user by username', async () => {
      await storage.createUser({
        username: 'testuser1',
        password: 'password123',
        avatarUrl: null,
        bio: null,
        createdAt: null
      });
      
      await storage.createUser({
        username: 'testuser2',
        password: 'password456',
        avatarUrl: null,
        bio: null,
        createdAt: null
      });
      
      const user = await storage.getUserByUsername('testuser2');
      expect(user).not.toBeNull();
      expect(user?.username).toBe('testuser2');
      expect(user?.id).toBe(2);
    });
  });
  
  describe('Post Operations', () => {
    test('createPost should add a post and return it with an ID', async () => {
      const postData = {
        content: 'Test post content',
        userId: 1,
        circleId: null,
        createdAt: new Date()
      };
      
      const post = await storage.createPost(postData);
      
      expect(post).toEqual({
        ...postData,
        id: 1
      });
      
      const retrievedPost = await storage.getPost(1);
      expect(retrievedPost).toEqual(post);
    });
    
    test('getUserPosts should retrieve all posts by a user', async () => {
      await storage.createPost({
        content: 'Post 1',
        userId: 1,
        circleId: null,
        createdAt: null
      });
      
      await storage.createPost({
        content: 'Post 2',
        userId: 2,
        circleId: null,
        createdAt: null
      });
      
      await storage.createPost({
        content: 'Post 3',
        userId: 1,
        circleId: null,
        createdAt: null
      });
      
      const userPosts = await storage.getUserPosts(1);
      expect(userPosts).toHaveLength(2);
      expect(userPosts[0].content).toBe('Post 1');
      expect(userPosts[1].content).toBe('Post 3');
    });
  });
  
  describe('Follower Operations', () => {
    test('createFollower should add a follower and return it with an ID', async () => {
      const followerData = {
        name: 'AI Follower',
        userId: 1,
        avatarUrl: 'https://example.com/ai.jpg',
        personality: 'friendly',
        active: true
      };
      
      const follower = await storage.createFollower(followerData);
      
      expect(follower).toEqual({
        ...followerData,
        id: 1
      });
      
      const retrievedFollower = await storage.getFollower(1);
      expect(retrievedFollower).toEqual(follower);
    });
  });
  
  describe('Circle Operations', () => {
    test('createCircle should add a circle and return it with an ID', async () => {
      const circleData = {
        name: 'Test Circle',
        userId: 1,
        description: 'A test circle',
        visibility: 'private' as const,
        createdAt: new Date()
      };
      
      const circle = await storage.createCircle(circleData);
      
      expect(circle).toEqual({
        ...circleData,
        id: 1
      });
      
      const retrievedCircle = await storage.getCircle(1);
      expect(retrievedCircle).toEqual(circle);
    });
    
    test('getUserCircles should retrieve all circles by a user', async () => {
      await storage.createCircle({
        name: 'Circle 1',
        userId: 1,
        description: null,
        visibility: 'private',
        createdAt: null
      });
      
      await storage.createCircle({
        name: 'Circle 2',
        userId: 2,
        description: null,
        visibility: 'private',
        createdAt: null
      });
      
      await storage.createCircle({
        name: 'Circle 3',
        userId: 1,
        description: null,
        visibility: 'shared',
        createdAt: null
      });
      
      const userCircles = await storage.getUserCircles(1);
      expect(userCircles).toHaveLength(2);
      expect(userCircles[0].name).toBe('Circle 1');
      expect(userCircles[1].name).toBe('Circle 3');
    });
  });
});