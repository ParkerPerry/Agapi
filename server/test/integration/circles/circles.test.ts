import request from 'supertest';
import { setupTestApp, closeTestApp } from '../../helpers/setup';
import { mockAuthentication } from '../../helpers/auth';
import { storage } from '../../../storage';
import { validateStatus, validateResponseAgainstSchema } from '../../helpers/validation';
import { circleResponseSchema } from '../../schemas/test-schemas';

describe('Circles API', () => {
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

  describe('GET /api/circles', () => {
    it('should return user circles', async () => {
      // Mock user circles
      storage.getUserCircles = jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'Test Circle',
          description: 'A test circle',
          icon: 'circle',
          color: '#ff0000',
          userId: 1,
          isDefault: true,
          visibility: 'private',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Another Circle',
          description: 'Another test circle',
          icon: 'chat',
          color: '#00ff00',
          userId: 1,
          isDefault: false,
          visibility: 'shared',
          createdAt: new Date().toISOString()
        }
      ]);

      const response = await request(app)
        .get('/api/circles');

      validateStatus(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      // Basic assertions for each circle
      response.body.forEach((circle: any) => {
        expect(circle).toHaveProperty('id');
        expect(circle).toHaveProperty('name');
        expect(circle).toHaveProperty('userId', 1);
      });
      
      // Validate schema
      validateResponseAgainstSchema(response.body[0], circleResponseSchema);
    });
  });

  describe('POST /api/circles', () => {
    it('should create a new circle', async () => {
      const circleData = {
        name: 'New Circle',
        description: 'A new test circle',
        icon: 'square',
        color: '#0000ff'
      };
      
      // Mock circle creation
      storage.createCircle = jest.fn().mockResolvedValue({
        id: 3,
        ...circleData,
        userId: 1,
        isDefault: false,
        visibility: 'private',
        createdAt: new Date().toISOString()
      });

      const response = await request(app)
        .post('/api/circles')
        .send(circleData);

      validateStatus(response, 201);
      expect(response.body).toHaveProperty('id', 3);
      expect(response.body).toHaveProperty('name', 'New Circle');
      expect(response.body).toHaveProperty('description', 'A new test circle');
      expect(response.body).toHaveProperty('userId', 1);
      
      // Validate schema
      validateResponseAgainstSchema(response.body, circleResponseSchema);
    });

    it('should return 400 when name is missing', async () => {
      const invalidData = {
        description: 'Missing name field',
        icon: 'square',
        color: '#0000ff'
      };

      const response = await request(app)
        .post('/api/circles')
        .send(invalidData);

      validateStatus(response, 400);
    });
  });

  describe('GET /api/circles/:id', () => {
    it('should return a specific circle', async () => {
      const circleId = 1;
      
      // Mock circle retrieval
      storage.getCircle = jest.fn().mockResolvedValue({
        id: circleId,
        name: 'Specific Circle',
        description: 'A specific test circle',
        icon: 'star',
        color: '#ff00ff',
        userId: 1,
        isDefault: false,
        visibility: 'private',
        createdAt: new Date().toISOString()
      });
      
      // Mock circle permission check
      storage.hasCirclePermission = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .get(`/api/circles/${circleId}`);

      validateStatus(response, 200);
      expect(response.body).toHaveProperty('id', circleId);
      expect(response.body).toHaveProperty('name', 'Specific Circle');
      
      // Validate schema
      validateResponseAgainstSchema(response.body, circleResponseSchema);
    });

    it('should return 404 for non-existent circle', async () => {
      const nonExistentId = 999;
      
      // Mock circle not found
      storage.getCircle = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/circles/${nonExistentId}`);

      validateStatus(response, 404);
    });

    it('should return 403 when user does not have permission', async () => {
      const circleId = 2;
      
      // Mock circle retrieval for a circle owned by another user
      storage.getCircle = jest.fn().mockResolvedValue({
        id: circleId,
        name: 'Other User Circle',
        description: 'A circle owned by another user',
        icon: 'lock',
        color: '#222222',
        userId: 2, // Different user
        isDefault: false,
        visibility: 'private',
        createdAt: new Date().toISOString()
      });
      
      // Mock permission denied
      storage.hasCirclePermission = jest.fn().mockResolvedValue(false);

      const response = await request(app)
        .get(`/api/circles/${circleId}`);

      validateStatus(response, 403);
    });
  });

  describe('PATCH /api/circles/:id', () => {
    it('should update a circle', async () => {
      const circleId = 1;
      const updateData = {
        name: 'Updated Circle',
        description: 'Updated description'
      };
      
      // Mock circle retrieval
      storage.getCircle = jest.fn().mockResolvedValue({
        id: circleId,
        name: 'Original Circle',
        description: 'Original description',
        icon: 'star',
        color: '#ff00ff',
        userId: 1,
        isDefault: false,
        visibility: 'private',
        createdAt: new Date().toISOString()
      });
      
      // Mock circle update
      storage.updateCircle = jest.fn().mockResolvedValue({
        id: circleId,
        name: 'Updated Circle',
        description: 'Updated description',
        icon: 'star',
        color: '#ff00ff',
        userId: 1,
        isDefault: false,
        visibility: 'private',
        createdAt: new Date().toISOString()
      });
      
      // Mock permission check
      storage.hasCirclePermission = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .patch(`/api/circles/${circleId}`)
        .send(updateData);

      validateStatus(response, 200);
      expect(response.body).toHaveProperty('id', circleId);
      expect(response.body).toHaveProperty('name', 'Updated Circle');
      expect(response.body).toHaveProperty('description', 'Updated description');
      
      // Validate schema
      validateResponseAgainstSchema(response.body, circleResponseSchema);
    });

    it('should return 403 when user does not have owner permission', async () => {
      const circleId = 2;
      const updateData = {
        name: 'Attempted Update'
      };
      
      // Mock circle retrieval for a circle owned by another user
      storage.getCircle = jest.fn().mockResolvedValue({
        id: circleId,
        name: 'Other User Circle',
        userId: 2 // Different user
      });
      
      // Mock permission denied
      storage.hasCirclePermission = jest.fn().mockResolvedValue(false);

      const response = await request(app)
        .patch(`/api/circles/${circleId}`)
        .send(updateData);

      validateStatus(response, 403);
    });
  });

  describe('GET /api/circles/:id/members', () => {
    it('should return circle members', async () => {
      const circleId = 1;
      
      // Mock circle retrieval
      storage.getCircle = jest.fn().mockResolvedValue({
        id: circleId,
        name: 'Test Circle',
        userId: 1
      });
      
      // Mock circle members retrieval
      storage.getCircleMembers = jest.fn().mockResolvedValue([
        {
          id: 1,
          circleId,
          userId: 1,
          role: 'owner',
          status: 'active',
          joinedAt: new Date().toISOString()
        },
        {
          id: 2,
          circleId,
          userId: 2,
          role: 'collaborator',
          status: 'active',
          joinedAt: new Date().toISOString()
        }
      ]);
      
      // Mock permission check
      storage.hasCirclePermission = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .get(`/api/circles/${circleId}/members`);

      validateStatus(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('userId');
      expect(response.body[0]).toHaveProperty('role');
    });
  });
});