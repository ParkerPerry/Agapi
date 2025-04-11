/**
 * Test schemas for API validation
 * Zod schemas for validating API responses
 */

import { z } from 'zod';

/**
 * Base response schema with common fields
 */
export const baseResponseSchema = z.object({
  id: z.number(),
});

/**
 * User response schema
 */
export const userResponseSchema = baseResponseSchema.extend({
  username: z.string(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: z.string().or(z.date()).nullable()
}).omit({ password: true });

/**
 * Post response schema
 */
export const postResponseSchema = baseResponseSchema.extend({
  content: z.string(),
  userId: z.number().nullable(),
  circleId: z.number().nullable(),
  labId: z.number().nullable(),
  labExperiment: z.boolean().nullable(),
  targetRole: z.enum(['control', 'treatment', 'observation', 'all']).nullable(),
  createdAt: z.string().or(z.date()).nullable()
});

/**
 * AI Follower response schema
 */
export const followerResponseSchema = baseResponseSchema.extend({
  name: z.string(),
  userId: z.number().nullable(),
  avatarUrl: z.string(),
  personality: z.string(),
  background: z.string().nullable(),
  interests: z.array(z.string()).nullable(),
  communicationStyle: z.string().nullable(),
  responsiveness: z.string(),
  active: z.boolean(),
  parentId: z.number().nullable(),
  responseChance: z.number(),
  interactionPreferences: z.object({
    topics: z.array(z.string()),
    avoidTopics: z.array(z.string())
  }).nullable(),
  responseDelay: z.object({
    min: z.number(),
    max: z.number()
  }).nullable(),
  tools: z.object({
    search: z.boolean(),
    calculator: z.boolean(),
    other: z.array(z.string()).optional()
  }).nullable()
});

/**
 * Circle response schema
 */
export const circleResponseSchema = baseResponseSchema.extend({
  name: z.string(),
  userId: z.number(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  isDefault: z.boolean(),
  visibility: z.enum(['private', 'shared']),
  createdAt: z.string().or(z.date()).nullable()
});

/**
 * Circle member response schema
 */
export const circleMemberResponseSchema = baseResponseSchema.extend({
  circleId: z.number(),
  userId: z.number(),
  role: z.enum(['owner', 'collaborator', 'viewer']),
  status: z.enum(['active', 'pending', 'rejected']),
  joinedAt: z.string().or(z.date()).nullable()
});

/**
 * AI Follower collective response schema
 */
export const followerCollectiveResponseSchema = baseResponseSchema.extend({
  name: z.string(),
  userId: z.number(),
  personality: z.string(),
  active: z.boolean(),
  description: z.string().nullable(),
  createdAt: z.string().or(z.date()).nullable()
});

/**
 * Lab response schema
 */
export const labResponseSchema = baseResponseSchema.extend({
  name: z.string(),
  userId: z.number(),
  circleId: z.number().nullable(),
  experimentType: z.enum(['a_b_test', 'multivariate', 'exploration']),
  description: z.string().nullable(),
  status: z.enum(['draft', 'active', 'completed', 'archived']),
  goals: z.string().nullable(),
  successMetrics: z.record(z.string()).nullable(),
  createdAt: z.string().or(z.date()).nullable(),
  updatedAt: z.string().or(z.date()).nullable(),
  completedAt: z.string().or(z.date()).nullable()
});

/**
 * Notification response schema
 */
export const notificationResponseSchema = baseResponseSchema.extend({
  userId: z.number(),
  type: z.string(),
  content: z.string(),
  read: z.boolean(),
  createdAt: z.string().or(z.date()).nullable(),
  relatedEntityId: z.number().nullable(),
  relatedEntityType: z.string().nullable()
});

/**
 * Error response schema
 */
export const errorResponseSchema = z.object({
  message: z.string()
});

/**
 * Pagination response schema
 */
export const paginationResponseSchema = z.object({
  data: z.array(z.any()),
  totalCount: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
  pageSize: z.number()
});