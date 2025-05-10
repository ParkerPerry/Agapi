# API Testing Guide for CircleTube

## Introduction

This guide explains how to write effective API tests for CircleTube. API tests verify that our endpoints work correctly, handle errors properly, and adhere to our API contract.

## Test Structure

API tests follow a consistent structure:

```typescript
// Imports
import { app } from '../../helpers/setup';
import { mockAuthentication, TestUser } from '../../helpers/auth';
import { userResponseSchema } from '../../schemas/test-schemas';
import supertest from 'supertest';

// Test suite
describe('User API', () => {
  let request: supertest.SuperAgentTest;
  let testUser: TestUser;
  
  // Setup
  beforeEach(async () => {
    request = supertest.agent(app);
    testUser = await mockAuthentication(request);
  });
  
  // Tests
  describe('GET /api/users/me', () => {
    test('returns the current user when authenticated', async () => {
      const response = await request.get('/api/users/me');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchAPISchema(userResponseSchema);
      expect(response.body.id).toBe(testUser.id);
    });
    
    test('returns 401 when not authenticated', async () => {
      const unauthenticatedRequest = supertest(app);
      const response = await unauthenticatedRequest.get('/api/users/me');
      
      expect(response.status).toBe(401);
    });
  });
  
  // Add more test suites for other endpoints...
});
```

## Key Components

### Request Agent

We use `supertest` to create a request agent that interacts with our Express app:

```typescript
const request = supertest.agent(app);
```

### Authentication

We provide helpers to authenticate requests:

```typescript
// Authenticate as a test user
const testUser = await mockAuthentication(request);

// Or authenticate as a specific user
await request.authenticateAs('username', 'password');
```

### Response Validation

We validate responses against Zod schemas:

```typescript
expect(response.body).toMatchAPISchema(userResponseSchema);
```

This ensures that our API responses match the expected structure.

## Testing Different HTTP Methods

### GET Requests

```typescript
test('GET /api/users/:id returns a user', async () => {
  const response = await request.get(`/api/users/${testUser.id}`);
  expect(response.status).toBe(200);
});
```

### POST Requests

```typescript
test('POST /api/posts creates a new post', async () => {
  const postData = { content: 'Test post content' };
  const response = await request
    .post('/api/posts')
    .send(postData);
    
  expect(response.status).toBe(201);
  expect(response.body.content).toBe('Test post content');
});
```

### PUT/PATCH Requests

```typescript
test('PATCH /api/users/:id updates a user', async () => {
  const updateData = { bio: 'Updated bio' };
  const response = await request
    .patch(`/api/users/${testUser.id}`)
    .send(updateData);
    
  expect(response.status).toBe(200);
  expect(response.body.bio).toBe('Updated bio');
});
```

### DELETE Requests

```typescript
test('DELETE /api/posts/:id deletes a post', async () => {
  // First create a post
  const createResponse = await request
    .post('/api/posts')
    .send({ content: 'To be deleted' });
    
  const postId = createResponse.body.id;
  
  // Then delete it
  const deleteResponse = await request.delete(`/api/posts/${postId}`);
  expect(deleteResponse.status).toBe(204);
  
  // Verify it's gone
  const getResponse = await request.get(`/api/posts/${postId}`);
  expect(getResponse.status).toBe(404);
});
```

## Testing Query Parameters

```typescript
test('GET /api/posts with limit parameter', async () => {
  // Create several posts first
  await request.post('/api/posts').send({ content: 'Post 1' });
  await request.post('/api/posts').send({ content: 'Post 2' });
  await request.post('/api/posts').send({ content: 'Post 3' });
  
  // Get with limit
  const response = await request.get('/api/posts?limit=2');
  
  expect(response.status).toBe(200);
  expect(response.body).toHaveLength(2);
});
```

## Testing File Uploads

```typescript
test('POST /api/users/avatar uploads an avatar', async () => {
  const response = await request
    .post('/api/users/avatar')
    .attach('avatar', 'path/to/test/image.jpg');
    
  expect(response.status).toBe(200);
  expect(response.body.avatarUrl).toBeTruthy();
});
```

## Testing Error Cases

Always test error cases to ensure proper error handling:

```typescript
test('POST /api/posts returns 400 for invalid input', async () => {
  const invalidData = { content: '' }; // Empty content
  const response = await request
    .post('/api/posts')
    .send(invalidData);
    
  expect(response.status).toBe(400);
  expect(response.body.message).toBeTruthy(); // Should have error message
});

test('GET /api/posts/:id returns 404 for non-existent post', async () => {
  const response = await request.get('/api/posts/99999');
  expect(response.status).toBe(404);
});
```

## Testing Permissions

```typescript
test('Cannot update another user\'s post', async () => {
  // First create a post as testUser
  const createResponse = await request
    .post('/api/posts')
    .send({ content: 'Test post' });
    
  const postId = createResponse.body.id;
  
  // Then try to update it as another user
  const anotherRequest = supertest.agent(app);
  await anotherRequest.authenticateAs('anotheruser', 'password');
  
  const updateResponse = await anotherRequest
    .patch(`/api/posts/${postId}`)
    .send({ content: 'Hacked content' });
    
  expect(updateResponse.status).toBe(403);
});
```

## Testing Pagination

```typescript
test('GET /api/posts supports pagination', async () => {
  // Create 10 posts
  for (let i = 0; i < 10; i++) {
    await request.post('/api/posts').send({ content: `Post ${i}` });
  }
  
  // Get first page
  const page1 = await request.get('/api/posts?page=1&pageSize=5');
  expect(page1.status).toBe(200);
  expect(page1.body.data).toHaveLength(5);
  expect(page1.body.totalPages).toBeGreaterThanOrEqual(2);
  
  // Get second page
  const page2 = await request.get('/api/posts?page=2&pageSize=5');
  expect(page2.status).toBe(200);
  expect(page2.body.data).toHaveLength(5);
  
  // Ensure different pages return different content
  const page1Ids = page1.body.data.map(post => post.id);
  const page2Ids = page2.body.data.map(post => post.id);
  
  // No overlap between pages
  expect(page1Ids.some(id => page2Ids.includes(id))).toBe(false);
});
```

## Testing Search

```typescript
test('GET /api/posts/search finds posts by content', async () => {
  // Create posts with different content
  await request.post('/api/posts').send({ content: 'Apple pie recipe' });
  await request.post('/api/posts').send({ content: 'Banana bread recipe' });
  
  // Search for apple
  const response = await request.get('/api/posts/search?q=apple');
  
  expect(response.status).toBe(200);
  expect(response.body.length).toBeGreaterThanOrEqual(1);
  expect(response.body[0].content).toContain('Apple');
});
```

## Testing Sorting

```typescript
test('GET /api/posts sorts by createdAt', async () => {
  // Create posts
  await request.post('/api/posts').send({ content: 'First post' });
  await request.post('/api/posts').send({ content: 'Second post' });
  
  // Get with sorting
  const response = await request.get('/api/posts?sort=createdAt&order=desc');
  
  expect(response.status).toBe(200);
  expect(new Date(response.body[0].createdAt).getTime())
    .toBeGreaterThanOrEqual(new Date(response.body[1].createdAt).getTime());
});
```

## Mocking Storage

We use a mock storage implementation to isolate tests from the database:

```typescript
import { mockStorage } from '../../helpers/mock-storage';

describe('Post API with mocked database', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    mockStorage.clearAll();
    
    // Seed with test data
    mockStorage.seedTestData();
  });
  
  test('GET /api/posts returns seeded posts', async () => {
    const response = await request.get('/api/posts');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });
});
```

## Testing CircleTube-Specific Features

### Testing AI Followers

```typescript
test('AI followers respond to posts', async () => {
  // Create an AI follower
  const createFollowerResponse = await request
    .post('/api/followers')
    .send({
      name: 'TestAI',
      personality: 'helpful',
      responseChance: 1.0 // Always respond
    });
    
  expect(createFollowerResponse.status).toBe(201);
  
  // Create a post
  const createPostResponse = await request
    .post('/api/posts')
    .send({ content: 'Hello AI!' });
    
  const postId = createPostResponse.body.id;
  
  // Wait for AI response (in real tests, we'd mock this)
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Check for AI responses
  const responsesResponse = await request.get(`/api/posts/${postId}/responses`);
  
  expect(responsesResponse.status).toBe(200);
  expect(responsesResponse.body.length).toBeGreaterThan(0);
  expect(responsesResponse.body[0].followerId).toBe(createFollowerResponse.body.id);
});
```

### Testing Circles

```typescript
test('Posts in private circles are only visible to members', async () => {
  // Create a private circle
  const createCircleResponse = await request
    .post('/api/circles')
    .send({
      name: 'Private Circle',
      visibility: 'private'
    });
    
  const circleId = createCircleResponse.body.id;
  
  // Create a post in the private circle
  const createPostResponse = await request
    .post('/api/posts')
    .send({
      content: 'Secret content',
      circleId
    });
    
  const postId = createPostResponse.body.id;
  
  // Another user should not see the post
  const anotherRequest = supertest.agent(app);
  await anotherRequest.authenticateAs('anotheruser', 'password');
  
  const getPostResponse = await anotherRequest.get(`/api/posts/${postId}`);
  expect(getPostResponse.status).toBe(404);
  
  // But if the user is added to the circle, they should see it
  await request
    .post(`/api/circles/${circleId}/members`)
    .send({ username: 'anotheruser', role: 'viewer' });
    
  const getPostAgainResponse = await anotherRequest.get(`/api/posts/${postId}`);
  expect(getPostAgainResponse.status).toBe(200);
});
```

### Testing Labs (A/B Tests)

```typescript
test('Lab experiments target specific user groups', async () => {
  // Create a lab experiment
  const createLabResponse = await request
    .post('/api/labs')
    .send({
      name: 'Response Style Test',
      experimentType: 'a_b_test',
      description: 'Testing different AI response styles'
    });
    
  const labId = createLabResponse.body.id;
  
  // Create a post in the lab
  const createPostResponse = await request
    .post('/api/posts')
    .send({
      content: 'Test lab post',
      labId,
      labExperiment: true,
      targetRole: 'treatment'
    });
    
  // Control group user should not see treatment posts
  const controlUserRequest = supertest.agent(app);
  await controlUserRequest.authenticateAs('controluser', 'password');
  
  // Set this user to the control group (in real tests we'd mock this)
  await request
    .post(`/api/labs/${labId}/participants`)
    .send({ username: 'controluser', role: 'control' });
    
  const labPostsResponse = await controlUserRequest.get('/api/posts');
  
  const foundPost = labPostsResponse.body.find(
    post => post.id === createPostResponse.body.id
  );
  
  expect(foundPost).toBeUndefined(); // Control user shouldn't see treatment post
});
```

## Best Practices

1. **Test each endpoint**: Make sure all endpoints have tests for success and error cases.
2. **Isolate tests**: Each test should be independent.
3. **Use descriptive test names**: Names should describe what's being tested.
4. **Clean up**: Reset the test state between tests.
5. **Validate with schemas**: Use Zod schemas to validate responses.
6. **Test business logic**: Not just HTTP status codes, but actual functionality.
7. **Avoid dependencies**: Mock external services and database calls.

## Example: Complete Post API Test Suite

Here's a complete example testing multiple aspects of the Post API:

```typescript
import { app } from '../../helpers/setup';
import { mockAuthentication, TestUser } from '../../helpers/auth';
import { postResponseSchema } from '../../schemas/test-schemas';
import supertest from 'supertest';

describe('Post API', () => {
  let request: supertest.SuperAgentTest;
  let testUser: TestUser;
  
  beforeEach(async () => {
    request = supertest.agent(app);
    testUser = await mockAuthentication(request);
  });
  
  describe('GET /api/posts', () => {
    test('returns a list of posts', async () => {
      const response = await request.get('/api/posts');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('supports pagination', async () => {
      const response = await request.get('/api/posts?page=1&pageSize=10');
      
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.totalCount).toBeDefined();
      expect(response.body.currentPage).toBe(1);
    });
  });
  
  describe('POST /api/posts', () => {
    test('creates a new post', async () => {
      const postData = { content: 'Test post content' };
      const response = await request
        .post('/api/posts')
        .send(postData);
        
      expect(response.status).toBe(201);
      expect(response.body).toMatchAPISchema(postResponseSchema);
      expect(response.body.content).toBe('Test post content');
      expect(response.body.userId).toBe(testUser.id);
    });
    
    test('returns 400 for invalid content', async () => {
      const invalidData = { content: '' };
      const response = await request
        .post('/api/posts')
        .send(invalidData);
        
      expect(response.status).toBe(400);
    });
    
    test('returns 401 when not authenticated', async () => {
      const unauthenticatedRequest = supertest(app);
      const response = await unauthenticatedRequest
        .post('/api/posts')
        .send({ content: 'Test post' });
        
      expect(response.status).toBe(401);
    });
  });
  
  describe('GET /api/posts/:id', () => {
    test('returns a post by ID', async () => {
      // First create a post
      const createResponse = await request
        .post('/api/posts')
        .send({ content: 'Test get by ID' });
        
      const postId = createResponse.body.id;
      
      // Then get it
      const getResponse = await request.get(`/api/posts/${postId}`);
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toMatchAPISchema(postResponseSchema);
      expect(getResponse.body.id).toBe(postId);
    });
    
    test('returns 404 for non-existent post', async () => {
      const response = await request.get('/api/posts/99999');
      expect(response.status).toBe(404);
    });
  });
  
  describe('PATCH /api/posts/:id', () => {
    test('updates a post', async () => {
      // First create a post
      const createResponse = await request
        .post('/api/posts')
        .send({ content: 'Original content' });
        
      const postId = createResponse.body.id;
      
      // Then update it
      const updateResponse = await request
        .patch(`/api/posts/${postId}`)
        .send({ content: 'Updated content' });
        
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.content).toBe('Updated content');
    });
    
    test('returns 403 when updating another user\'s post', async () => {
      // Create a post as testUser
      const createResponse = await request
        .post('/api/posts')
        .send({ content: 'Not my post' });
        
      const postId = createResponse.body.id;
      
      // Try to update as another user
      const anotherRequest = supertest.agent(app);
      await anotherRequest.authenticateAs('anotheruser', 'password');
      
      const updateResponse = await anotherRequest
        .patch(`/api/posts/${postId}`)
        .send({ content: 'Hacked content' });
        
      expect(updateResponse.status).toBe(403);
    });
  });
  
  describe('DELETE /api/posts/:id', () => {
    test('deletes a post', async () => {
      // First create a post
      const createResponse = await request
        .post('/api/posts')
        .send({ content: 'To be deleted' });
        
      const postId = createResponse.body.id;
      
      // Then delete it
      const deleteResponse = await request.delete(`/api/posts/${postId}`);
      expect(deleteResponse.status).toBe(204);
      
      // Verify it's gone
      const getResponse = await request.get(`/api/posts/${postId}`);
      expect(getResponse.status).toBe(404);
    });
    
    test('returns 403 when deleting another user\'s post', async () => {
      // Create a post as testUser
      const createResponse = await request
        .post('/api/posts')
        .send({ content: 'Not my post to delete' });
        
      const postId = createResponse.body.id;
      
      // Try to delete as another user
      const anotherRequest = supertest.agent(app);
      await anotherRequest.authenticateAs('anotheruser', 'password');
      
      const deleteResponse = await anotherRequest.delete(`/api/posts/${postId}`);
      expect(deleteResponse.status).toBe(403);
    });
  });
});
```

This testing approach ensures that your API is thoroughly tested and adheres to the expected behavior.