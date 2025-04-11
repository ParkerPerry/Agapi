/**
 * Simple schema validation tests
 * These tests don't require any external connections
 */

import { z } from 'zod';
import * as schemas from '../schemas/test-schemas';

describe('Schema Validation', () => {
  test('schemas should be valid Zod schemas', () => {
    // Check that our schemas are valid Zod schemas
    expect(schemas.baseResponseSchema instanceof z.ZodType).toBe(true);
    expect(schemas.userResponseSchema instanceof z.ZodType).toBe(true);
    expect(schemas.postResponseSchema instanceof z.ZodType).toBe(true);
    expect(schemas.followerResponseSchema instanceof z.ZodType).toBe(true);
    expect(schemas.circleResponseSchema instanceof z.ZodType).toBe(true);
  });

  test('userResponseSchema validates correct data', () => {
    const validUser = {
      id: 1,
      username: 'testuser',
      avatarUrl: 'https://example.com/avatar.jpg',
      bio: 'Test user bio',
      createdAt: new Date().toISOString()
    };
    
    const result = schemas.userResponseSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  test('userResponseSchema rejects invalid data', () => {
    const invalidUser = {
      id: 'not-a-number', // should be a number
      username: 123, // should be a string
      avatarUrl: 'https://example.com/avatar.jpg',
      bio: 'Test user bio',
      createdAt: new Date().toISOString()
    };
    
    const result = schemas.userResponseSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });
});