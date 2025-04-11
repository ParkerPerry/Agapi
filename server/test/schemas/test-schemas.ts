import { z } from 'zod';

/**
 * Schema for validating user objects in responses
 */
export const userResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  createdAt: z.string().optional(),
  avatarUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
});

/**
 * Schema for validating AI follower objects in responses
 */
export const followerResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  personality: z.string(),
  userId: z.number(),
  avatarUrl: z.string().nullable().optional(),
  background: z.string().nullable().optional(),
  responsiveness: z.string().optional(),
  communicationStyle: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  parentId: z.number().nullable().optional(),
  parentName: z.string().nullable().optional(),
  tools: z.string().array().optional().nullable(),
});

/**
 * Schema for validating post objects in responses
 */
export const postResponseSchema = z.object({
  id: z.number(),
  content: z.string(),
  userId: z.number(),
  createdAt: z.string().optional(),
  interactions: z.array(z.any()).optional(),
});

/**
 * Schema for validating circle objects in responses
 */
export const circleResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  userId: z.number(),
  isDefault: z.boolean().optional(),
  visibility: z.enum(['private', 'shared']).optional(),
  createdAt: z.string().optional(),
});