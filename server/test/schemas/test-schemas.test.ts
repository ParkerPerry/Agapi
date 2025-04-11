/**
 * Tests for schema validation
 */

import * as schemas from './test-schemas';

describe('API Schemas', () => {
  test('baseResponseSchema validates correctly', () => {
    // Valid data
    const validData = { id: 1 };
    const result = schemas.baseResponseSchema.safeParse(validData);
    expect(result.success).toBe(true);
    
    // Invalid data
    const invalidData = { id: 'not-a-number' };
    const invalidResult = schemas.baseResponseSchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });
  
  test('userResponseSchema validates correctly', () => {
    // Valid data
    const validData = {
      id: 1,
      username: 'testuser',
      avatarUrl: 'http://example.com/avatar.png',
      bio: 'Test bio',
      createdAt: new Date().toISOString()
    };
    const result = schemas.userResponseSchema.safeParse(validData);
    expect(result.success).toBe(true);
    
    // Check with null values for optional fields
    const nullFieldsData = {
      id: 1,
      username: 'testuser',
      avatarUrl: null,
      bio: null,
      createdAt: null
    };
    const nullFieldsResult = schemas.userResponseSchema.safeParse(nullFieldsData);
    expect(nullFieldsResult.success).toBe(true);
    
    // Invalid data - missing required field
    const invalidData = {
      id: 1,
      avatarUrl: 'http://example.com/avatar.png',
      bio: 'Test bio',
      createdAt: new Date().toISOString()
    };
    const invalidResult = schemas.userResponseSchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });
  
  test('postResponseSchema validates correctly', () => {
    // Valid data
    const validData = {
      id: 1,
      content: 'Test post content',
      userId: 1,
      circleId: 2,
      labId: null,
      labExperiment: false,
      targetRole: 'control',
      createdAt: new Date().toISOString()
    };
    const result = schemas.postResponseSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
  
  test('followerResponseSchema validates correctly', () => {
    // Valid data with all fields
    const validData = {
      id: 1,
      name: 'AI Follower',
      userId: 2,
      avatarUrl: 'http://example.com/ai.png',
      personality: 'friendly',
      background: 'AI assistant',
      interests: ['tech', 'helping'],
      communicationStyle: 'formal',
      responsiveness: 'active',
      active: true,
      parentId: null,
      responseChance: 0.8,
      interactionPreferences: {
        topics: ['tech', 'science'],
        avoidTopics: ['politics']
      },
      responseDelay: {
        min: 1000,
        max: 5000
      },
      tools: {
        search: true,
        calculator: false,
        other: ['weather']
      }
    };
    const result = schemas.followerResponseSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
  
  test('circleResponseSchema validates correctly', () => {
    // Valid data
    const validData = {
      id: 1,
      name: 'Test Circle',
      userId: 1,
      description: 'A test circle',
      icon: 'circle-icon',
      color: '#FF0000',
      isDefault: false,
      visibility: 'private',
      createdAt: new Date().toISOString()
    };
    const result = schemas.circleResponseSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});