/**
 * Test data factories
 * Utility functions to create test entities for use in tests
 */

import { User, Post, AiFollower, Circle, CircleMember } from '@shared/schema';

/**
 * Create a test user
 * @param {Partial<User>} overrides - Optional property overrides
 * @returns {User} Test user
 */
export function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'testuser',
    password: 'password123',
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
    ...overrides
  };
}

/**
 * Create a test post
 * @param {Partial<Post>} overrides - Optional property overrides
 * @returns {Post} Test post
 */
export function createTestPost(overrides: Partial<Post> = {}): Post {
  return {
    id: 1,
    userId: 1,
    content: 'Test post content',
    createdAt: new Date(),
    circleId: null,
    labId: null,
    labExperiment: null,
    targetRole: null,
    ...overrides
  };
}

/**
 * Create a test AI follower
 * @param {Partial<AiFollower>} overrides - Optional property overrides
 * @returns {AiFollower} Test AI follower
 */
export function createTestFollower(overrides: Partial<AiFollower> = {}): AiFollower {
  return {
    id: 1,
    userId: 1,
    name: 'Test Follower',
    avatarUrl: 'https://example.com/avatar.png',
    personality: 'friendly',
    background: 'AI assistant',
    interests: ['tech', 'art'],
    communicationStyle: 'casual',
    responsiveness: 'active',
    active: true,
    parentId: null,
    responseChance: 50,
    interactionPreferences: null,
    tools: null,
    ...overrides
  };
}

/**
 * Create a test circle
 * @param {Partial<Circle>} overrides - Optional property overrides
 * @returns {Circle} Test circle
 */
export function createTestCircle(overrides: Partial<Circle> = {}): Circle {
  return {
    id: 1,
    name: 'Test Circle',
    userId: 1,
    description: 'A test circle',
    icon: null,
    color: null,
    isDefault: false,
    visibility: 'private',
    createdAt: new Date(),
    ...overrides
  };
}

/**
 * Create a test circle member
 * @param {Partial<CircleMember>} overrides - Optional property overrides
 * @returns {CircleMember} Test circle member
 */
export function createTestCircleMember(overrides: Partial<CircleMember> = {}): CircleMember {
  return {
    id: 1,
    circleId: 1,
    userId: 1,
    role: 'member',
    status: 'active',
    joinedAt: new Date(),
    ...overrides
  };
}