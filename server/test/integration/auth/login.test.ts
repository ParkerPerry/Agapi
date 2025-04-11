import request from 'supertest';
import { setupTestApp, closeTestApp } from '../../helpers/setup';
import { storage } from '../../../storage';
import { validateStatus } from '../../helpers/validation';
import { userResponseSchema } from '../../schemas/test-schemas';

describe('Authentication API', () => {
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

  describe('POST /api/login', () => {
    it('should return 200 and user data on successful login', async () => {
      // Mock storage methods for successful login
      storage.getUserByUsername = jest.fn().mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        createdAt: new Date().toISOString()
      });
      
      // We need to mock the password comparison function
      // This requires importing and mocking the auth module
      jest.mock('../../../auth', () => ({
        comparePasswords: jest.fn().mockResolvedValue(true)
      }));

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'password'
        });

      validateStatus(response, 200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('username', 'testuser');
    });

    it('should return 401 on invalid credentials', async () => {
      // Mock storage methods for failed login
      storage.getUserByUsername = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'invaliduser',
          password: 'invalidpassword'
        });

      validateStatus(response, 401);
    });
  });

  describe('POST /api/register', () => {
    it('should create a new user and return 201 status', async () => {
      // Mock storage methods for registration
      storage.getUserByUsername = jest.fn().mockResolvedValue(null);
      storage.createUser = jest.fn().mockResolvedValue({
        id: 2,
        username: 'newuser',
        password: 'hashedpassword',
        createdAt: new Date().toISOString()
      });

      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'newuser',
          password: 'newpassword'
        });

      validateStatus(response, 201);
      expect(response.body).toHaveProperty('id', 2);
      expect(response.body).toHaveProperty('username', 'newuser');
    });

    it('should return 400 when username already exists', async () => {
      // Mock storage to indicate username exists
      storage.getUserByUsername = jest.fn().mockResolvedValue({
        id: 1,
        username: 'existinguser',
        password: 'hashedpassword',
        createdAt: new Date().toISOString()
      });

      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'existinguser',
          password: 'password'
        });

      validateStatus(response, 400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/logout', () => {
    it('should logout the user and return 200 status', async () => {
      // Create a more sophisticated mock for req.logout
      const mockLogout = jest.fn((callback) => callback());
      app.use((req: any, _res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, username: 'testuser' };
        req.logout = mockLogout;
        req.session = {
          destroy: jest.fn((callback) => callback())
        };
        next();
      });

      const response = await request(app)
        .post('/api/logout');

      validateStatus(response, 200);
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('GET /api/user', () => {
    it('should return user data when authenticated', async () => {
      // Mock authentication
      app.use((req: any, _res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { 
          id: 1, 
          username: 'testuser',
          avatarUrl: 'https://example.com/avatar.png',
          createdAt: new Date().toISOString()
        };
        next();
      });

      const response = await request(app)
        .get('/api/user');

      validateStatus(response, 200);
      expect(response.body).toMatchObject({
        id: 1,
        username: 'testuser'
      });
      
      // Validate response against schema
      expect(userResponseSchema.safeParse(response.body).success).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      // Mock unauthenticated state
      app.use((req: any, _res: any, next: any) => {
        req.isAuthenticated = () => false;
        next();
      });

      const response = await request(app)
        .get('/api/user');

      validateStatus(response, 401);
    });
  });
});