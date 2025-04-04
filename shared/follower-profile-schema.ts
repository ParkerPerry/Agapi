import { z } from "zod";

/**
 * Schema for AI Follower profiles when importing from JSON
 */
export const AIFollowerProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  personality: z.string().min(1, "Personality is required"),
  avatarUrl: z.string().url("Avatar URL must be a valid URL"),
  responsiveness: z.enum(["instant", "active", "casual", "zen"]),
  active: z.boolean().default(true),
  
  // Optional fields
  background: z.string().optional(),
  interests: z.array(z.string()).optional(),
  communicationStyle: z.string().optional(),
  interactionPreferences: z.object({
    likes: z.array(z.string()).optional().default([]),
    dislikes: z.array(z.string()).optional().default([])
  }).optional(),
  responseDelay: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }).optional(),
  responseChance: z.number().min(0).max(100).optional(), // Allow percentages (0-100)
  tools: z.object({
    equipped: z.array(z.string()).default([]),
    customInstructions: z.string().default("")
  }).optional(),

  // Metadata field for import/export data
  metadata: z.object({
    exportedAt: z.string().optional(),
    exportedBy: z.string().optional(),
    model: z.string().optional(),
    originalName: z.string().optional(),
    originalUrl: z.string().optional(),
    source: z.string().optional()
  }).optional(),
  schemaVersion: z.string().optional()
});

export type AIFollowerProfile = z.infer<typeof AIFollowerProfileSchema>;