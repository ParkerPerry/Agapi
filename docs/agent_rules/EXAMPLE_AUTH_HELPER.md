# Example Authentication Helper for Tests

This document provides a complete example implementation of the `auth.ts` helper for testing. This helper simplifies authentication in test scenarios.

## Implementation

```typescript
/**
 * Authentication helpers for tests
 */

import supertest from 'supertest';
import { SimpleMockStorage } from './mock-storage';

/**
 * Test user type definition
 */
export interface TestUser {
  id: number;
  username: string;
  password: string;
}

/**
 * Default test users
 */
export const TEST_USERS: TestUser[] = [
  { id: 1, username: 'testuser', password: 'password123' },
  { id: 2, username: 'otheruser', password: 'password456' },
  { id: 3, username: 'adminuser', password: 'adminpass' }
];

/**
 * Mock storage instance for authentication
 */
const authStorage = new SimpleMockStorage();

/**
 * Initialize the auth storage with test users
 */
export async function initAuthStorage(): Promise<void> {
  // Clear existing users
  authStorage.clearAll();
  
  // Add test users
  for (const user of TEST_USERS) {
    await authStorage.createUser({
      username: user.username,
      password: user.password,
      avatarUrl: null,
      bio: null,
      createdAt: new Date()
    });
  }
}

/**
 * Authenticates a supertest agent with a default test user
 * @param agent - The supertest agent to authenticate
 * @param userIndex - Index of the test user to use (defaults to 0 - first user)
 * @returns The authenticated user
 */
export async function mockAuthentication(
  agent: supertest.SuperAgentTest,
  userIndex = 0
): Promise<TestUser> {
  // Initialize storage if needed
  await initAuthStorage();
  
  const testUser = TEST_USERS[userIndex];
  
  // Login the user
  const response = await agent
    .post('/api/auth/login')
    .send({
      username: testUser.username,
      password: testUser.password
    });
    
  if (response.status !== 200) {
    throw new Error(
      `Failed to authenticate test user: ${response.status} ${response.body.message || ''}`
    );
  }
  
  return testUser;
}

/**
 * Add authenticateAs method to supertest.SuperAgentTest
 */
declare module 'supertest' {
  interface SuperAgentTest {
    authenticateAs(username: string, password: string): Promise<supertest.SuperAgentTest>;
  }
}

/**
 * Add authenticateAs method to SuperAgentTest prototype
 */
supertest.SuperAgentTest.prototype.authenticateAs = async function(
  username: string,
  password: string
): Promise<supertest.SuperAgentTest> {
  await initAuthStorage();
  
  // Authenticate with provided credentials
  const response = await this
    .post('/api/auth/login')
    .send({ username, password });
    
  if (response.status !== 200) {
    throw new Error(
      `Failed to authenticate as ${username}: ${response.status} ${response.body.message || ''}`
    );
  }
  
  return this;
};

/**
 * Create a test JWT token for a user (for unit testing)
 * @param user - The user to create a token for
 * @returns A JWT token
 */
export function createTestToken(user: TestUser): string {
  // This is a simplified example - in a real implementation, 
  // we would use a JWT library to create a proper token
  return `mock-jwt-token-for-user-${user.id}`;
}

/**
 * Creates an authenticated request for API tests
 * @param app - The Express app to test
 * @param userIndex - Index of the test user to use
 * @returns Authenticated supertest agent
 */
export async function getAuthenticatedAgent(
  app: any,
  userIndex = 0
): Promise<supertest.SuperAgentTest> {
  const agent = supertest.agent(app);
  await mockAuthentication(agent, userIndex);
  return agent;
}

/**
 * Mock middleware that simulates authentication for unit tests
 * Used when you want to test routes in isolation without requiring the full auth flow
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function mockAuthMiddleware(req: any, res: any, next: any): void {
  // Add the first test user to the request
  req.user = {
    id: TEST_USERS[0].id,
    username: TEST_USERS[0].username
  };
  
  // Add isAuthenticated method
  req.isAuthenticated = () => true;
  
  next();
}

/**
 * Register a new test user
 * @param agent - The supertest agent
 * @param username - Username for the new user
 * @param password - Password for the new user
 * @returns The created user
 */
export async function registerTestUser(
  agent: supertest.SuperAgentTest,
  username: string,
  password: string
): Promise<any> {
  const response = await agent
    .post('/api/auth/register')
    .send({
      username,
      password,
      confirmPassword: password
    });
    
  if (response.status !== 201) {
    throw new Error(
      `Failed to register test user: ${response.status} ${response.body.message || ''}`
    );
  }
  
  return response.body;
}

/**
 * Logout the current user
 * @param agent - The supertest agent
 */
export async function logoutUser(agent: supertest.SuperAgentTest): Promise<void> {
  await agent.post('/api/auth/logout');
}
```

## Usage Examples

### Basic Authentication in Tests

```typescript
import { app } from '../helpers/setup';
import { mockAuthentication } from '../helpers/auth';
import supertest from 'supertest';

describe('Authenticated API Test', () => {
  let request: supertest.SuperAgentTest;
  
  beforeEach(async () => {
    request = supertest.agent(app);
    await mockAuthentication(request);
  });
  
  test('GET /api/users/me returns the authenticated user', async () => {
    const response = await request.get('/api/users/me');
    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser');
  });
});
```

### Authenticating as Different Users

```typescript
import { app } from '../helpers/setup';
import supertest from 'supertest';

describe('Multi-user Test', () => {
  test('Different users get different data', async () => {
    // Authenticate as first user
    const user1Request = supertest.agent(app);
    await user1Request.authenticateAs('testuser', 'password123');
    
    // Authenticate as second user
    const user2Request = supertest.agent(app);
    await user2Request.authenticateAs('otheruser', 'password456');
    
    // Each user gets their own data
    const user1Response = await user1Request.get('/api/users/me');
    const user2Response = await user2Request.get('/api/users/me');
    
    expect(user1Response.body.username).toBe('testuser');
    expect(user2Response.body.username).toBe('otheruser');
  });
});
```

### Testing Authentication Itself

```typescript
import { app } from '../helpers/setup';
import { TEST_USERS } from '../helpers/auth';
import supertest from 'supertest';

describe('Auth API', () => {
  let request: supertest.SuperAgentTest;
  
  beforeEach(() => {
    request = supertest.agent(app);
  });
  
  test('Login succeeds with valid credentials', async () => {
    const response = await request
      .post('/api/auth/login')
      .send({
        username: TEST_USERS[0].username,
        password: TEST_USERS[0].password
      });
      
    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
  });
  
  test('Login fails with invalid credentials', async () => {
    const response = await request
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'wrongpassword'
      });
      
    expect(response.status).toBe(401);
  });
  
  test('Register creates a new user', async () => {
    const response = await request
      .post('/api/auth/register')
      .send({
        username: 'newuser',
        password: 'newpassword',
        confirmPassword: 'newpassword'
      });
      
    expect(response.status).toBe(201);
    expect(response.body.user.username).toBe('newuser');
    
    // Should be able to login with new credentials
    const loginResponse = await request
      .post('/api/auth/login')
      .send({
        username: 'newuser',
        password: 'newpassword'
      });
      
    expect(loginResponse.status).toBe(200);
  });
  
  test('Logout clears authentication', async () => {
    // Login first
    await request
      .post('/api/auth/login')
      .send({
        username: TEST_USERS[0].username,
        password: TEST_USERS[0].password
      });
      
    // Verify we're logged in
    const profileResponse = await request.get('/api/users/me');
    expect(profileResponse.status).toBe(200);
    
    // Logout
    const logoutResponse = await request.post('/api/auth/logout');
    expect(logoutResponse.status).toBe(200);
    
    // Verify we're logged out
    const profileResponseAfterLogout = await request.get('/api/users/me');
    expect(profileResponseAfterLogout.status).toBe(401);
  });
});
```

### Using the Helper for Unit Tests

```typescript
import { mockAuthMiddleware, TEST_USERS } from '../helpers/auth';
import { userController } from '../../controllers/user-controller';

describe('User Controller', () => {
  test('getCurrentUser returns the authenticated user', () => {
    // Create mock request, response, next
    const req = {
      // Populated by mockAuthMiddleware
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    const next = jest.fn();
    
    // Apply the mock middleware
    mockAuthMiddleware(req, res, next);
    
    // Call the controller method
    userController.getCurrentUser(req, res, next);
    
    // Verify it returned the expected user
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: TEST_USERS[0].id,
        username: TEST_USERS[0].username
      })
    );
  });
});
```

## Key Points

1. The auth helper provides both high-level and low-level authentication functions.
2. It extends the SuperAgentTest interface to add an authenticateAs method.
3. It provides middleware mocks for unit testing routes without full integration.
4. It includes helper functions for testing the auth API itself.
5. It automatically initializes test users when needed.

This implementation makes it easy to authenticate test requests and simulate different users in your test scenarios.