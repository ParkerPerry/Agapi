import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Existing tables remain unchanged
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Update circles table to include visibility
export const circles = pgTable("circles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  visibility: text("visibility", { enum: ["private", "shared"] }).default("private").notNull(),
});

// Update circleMembers table definition to include status
export const circleMembers = pgTable("circle_members", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").references(() => circles.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role", { enum: ["owner", "collaborator", "viewer"] }).notNull(),
  status: text("status", { enum: ["active", "deactivated"] }).default("active").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// New table for circle invitations
export const circleInvitations = pgTable("circle_invitations", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").references(() => circles.id).notNull(),
  inviterId: integer("inviter_id").references(() => users.id).notNull(),
  inviteeId: integer("invitee_id").references(() => users.id).notNull(),
  role: text("role", { enum: ["collaborator", "viewer"] }).notNull(),
  status: text("status", { enum: ["pending", "accepted", "declined"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Join table for circles and AI followers
export const circleFollowers = pgTable("circle_followers", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").references(() => circles.id).notNull(),
  aiFollowerId: integer("ai_follower_id").references(() => ai_followers.id).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
  muted: boolean("muted").default(false).notNull(),
});

// Join table for circles and AI follower collectives
export const circleCollectives = pgTable("circle_collectives", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").references(() => circles.id).notNull(),
  collectiveId: integer("collective_id").references(() => aiFollowerCollectives.id).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Update posts table to include circle_id and lab experiment fields
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  circleId: integer("circle_id").references(() => circles.id),
  labId: integer("lab_id").references(() => labs.id),
  labExperiment: boolean("lab_experiment").default(false),
  targetRole: text("target_role", { 
    enum: ["control", "treatment", "observation", "all"]
  }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


// Update the table name from aiFollowers to ai_followers
export const ai_followers = pgTable("ai_followers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  personality: text("personality").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  background: text("background"),
  interests: text("interests").array(),
  communicationStyle: text("communication_style"),
  interactionPreferences: json("interaction_preferences").$type<{
    likes: string[];
    dislikes: string[];
  }>(),
  active: boolean("active").notNull().default(true),
  responsiveness: text("responsiveness", {
    enum: ["instant", "active", "casual", "zen"]
  }).notNull().default("active"),
  responseDelay: json("response_delay").$type<{
    min: number;
    max: number;
  }>().notNull().default({ min: 1, max: 60 }),
  responseChance: integer("response_chance").notNull().default(80),
  // Tool library for AI followers
  tools: json("tools").$type<{
    equipped: Array<{
      id: string;
      name: string;
      description: string;
      enabled: boolean;
    }>;
    customInstructions: string;
  }>(),
  // Parent-child relationship for clones
  parentId: integer("parent_id").references(() => ai_followers.id),
});

export const pendingResponses = pgTable("pending_responses", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id),
  aiFollowerId: integer("ai_follower_id").references(() => ai_followers.id),
  scheduledFor: timestamp("scheduled_for").notNull(),
  processed: boolean("processed").notNull().default(false),
  metadata: text("metadata"), // Stores thread context for threaded replies
  createdAt: timestamp("created_at").defaultNow(),
});

// Single definition of aiInteractions with self-reference
export const aiInteractions = pgTable("ai_interactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id),
  aiFollowerId: integer("ai_follower_id").references(() => ai_followers.id),
  userId: integer("user_id").references(() => users.id),
  type: text("type", { enum: ["like", "comment", "reply"] }).notNull(),
  content: text("content"),
  parentId: integer("parent_id").references((): any => aiInteractions.id),
  createdAt: timestamp("created_at").defaultNow(),
  toolsUsed: json("tools_used").$type<{
    used: boolean;
    tools: Array<{
      id: string;
      name: string;
      usageCount: number;
      examples: string[];
    }>;
  }>(),
});

export const aiInteractionsRelations = relations(aiInteractions, ({ one }) => ({
  parent: one(aiInteractions, {
    fields: [aiInteractions.parentId],
    references: [aiInteractions.id],
  }),
  aiFollower: one(ai_followers, {
    fields: [aiInteractions.aiFollowerId],
    references: [ai_followers.id],
  }),
  post: one(posts, {
    fields: [aiInteractions.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [aiInteractions.userId],
    references: [users.id],
  }),
}));

// Add relation for parent-child AI followers
export const aiFollowersRelations = relations(ai_followers, ({ one }) => ({
  parent: one(ai_followers, {
    fields: [ai_followers.parentId],
    references: [ai_followers.id],
  }),
}));

export const circlesRelations = relations(circles, ({ one, many }) => ({
  owner: one(users, {
    fields: [circles.userId],
    references: [users.id],
  }),
  followers: many(circleFollowers),
  collectives: many(circleCollectives),
  posts: many(posts),
  members: many(circleMembers),
  invitations: many(circleInvitations),
}));

export const circleFollowersRelations = relations(circleFollowers, ({ one }) => ({
  circle: one(circles, {
    fields: [circleFollowers.circleId],
    references: [circles.id],
  }),
  aiFollower: one(ai_followers, {
    fields: [circleFollowers.aiFollowerId],
    references: [ai_followers.id],
  }),
}));

// Relations for circle collectives
export const circleCollectivesRelations = relations(circleCollectives, ({ one }) => ({
  circle: one(circles, {
    fields: [circleCollectives.circleId],
    references: [circles.id],
  }),
  collective: one(aiFollowerCollectives, {
    fields: [circleCollectives.collectiveId],
    references: [aiFollowerCollectives.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  circle: one(circles, {
    fields: [posts.circleId],
    references: [circles.id],
  }),
  lab: one(labs, {
    fields: [posts.labId],
    references: [labs.id],
  }),
}));

export const circleMembersRelations = relations(circleMembers, ({ one }) => ({
  circle: one(circles, {
    fields: [circleMembers.circleId],
    references: [circles.id],
  }),
  user: one(users, {
    fields: [circleMembers.userId],
    references: [users.id],
  }),
}));

export const circleInvitationsRelations = relations(circleInvitations, ({ one }) => ({
  circle: one(circles, {
    fields: [circleInvitations.circleId],
    references: [circles.id],
  }),
  inviter: one(users, {
    fields: [circleInvitations.inviterId],
    references: [users.id],
  }),
  invitee: one(users, {
    fields: [circleInvitations.inviteeId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPostSchema = createInsertSchema(posts)
  .pick({
    content: true,
    circleId: true,
    labId: true,
    labExperiment: true,
    targetRole: true,
  });

export const insertCircleSchema = createInsertSchema(circles)
  .pick({
    name: true,
    description: true,
    icon: true,
    color: true,
    visibility: true,
  });

export const insertCircleFollowerSchema = createInsertSchema(circleFollowers)
  .pick({
    circleId: true,
    aiFollowerId: true,
    muted: true,
  });

export const insertCircleCollectiveSchema = createInsertSchema(circleCollectives)
  .pick({
    circleId: true,
    collectiveId: true,
  });

export const insertInteractionSchema = createInsertSchema(aiInteractions)
  .pick({
    postId: true,
    content: true,
    parentId: true,
  })
  .extend({
    type: z.enum(["like", "comment", "reply"]),
  });

// Update the insert schema to include status
export const insertCircleMemberSchema = createInsertSchema(circleMembers)
  .pick({
    circleId: true,
    userId: true,
    role: true,
    status: true,
  });

export const insertCircleInvitationSchema = createInsertSchema(circleInvitations)
  .pick({
    circleId: true,
    inviteeId: true,
    role: true,
  });

// Add notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type", {
    enum: ["mention", "circle_invite", "follower_interaction", "circle_update", "lab_experiment"]
  }).notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  metadata: json("metadata").$type<{
    sourceId?: number;
    sourceType?: string;
    actionUrl?: string;
    labId?: number;
    labName?: string;
    circleName?: string;
    circleRole?: string;
    experimentType?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Add notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Add insert schema for notifications
export const insertNotificationSchema = createInsertSchema(notifications)
  .pick({
    userId: true,
    type: true,
    content: true,
    metadata: true,
  });

// Add notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type AiFollower = typeof ai_followers.$inferSelect;
export type AiInteraction = typeof aiInteractions.$inferSelect;
export type PendingResponse = typeof pendingResponses.$inferSelect;
export type Circle = typeof circles.$inferSelect;
export type InsertCircle = z.infer<typeof insertCircleSchema>;
export type CircleFollower = typeof circleFollowers.$inferSelect;
export type InsertCircleFollower = z.infer<typeof insertCircleFollowerSchema>;
export type CircleCollective = typeof circleCollectives.$inferSelect;
export type InsertCircleCollective = z.infer<typeof insertCircleCollectiveSchema>;
export type InsertCircleMember = z.infer<typeof insertCircleMemberSchema>;
export type CircleMember = typeof circleMembers.$inferSelect;
export type InsertCircleInvitation = z.infer<typeof insertCircleInvitationSchema>;
export type CircleInvitation = typeof circleInvitations.$inferSelect;

// Table for direct chat messages between users and AI followers
export const directChats = pgTable("direct_chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  aiFollowerId: integer("ai_follower_id").references(() => ai_followers.id).notNull(),
  content: text("content").notNull(),
  isUserMessage: boolean("is_user_message").notNull(),
  toolsUsed: json("tools_used").$type<{
    used: boolean;
    tools: Array<{
      id: string;
      name: string;
      usageCount: number;
      examples: string[];
    }>;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Direct chats relations
export const directChatsRelations = relations(directChats, ({ one }) => ({
  user: one(users, {
    fields: [directChats.userId],
    references: [users.id],
  }),
  aiFollower: one(ai_followers, {
    fields: [directChats.aiFollowerId],
    references: [ai_followers.id],
  }),
}));

// Insert schema for direct chats
export const insertDirectChatSchema = createInsertSchema(directChats)
  .pick({
    userId: true,
    aiFollowerId: true,
    content: true,
    isUserMessage: true,
    toolsUsed: true,
  });

// Direct chat type definitions
export type DirectChat = typeof directChats.$inferSelect;
export type InsertDirectChat = z.infer<typeof insertDirectChatSchema>;

// Table for AI follower collectives
export const aiFollowerCollectives = pgTable("ai_follower_collectives", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  personality: text("personality").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").notNull().default(true),
});

// Table for AI follower collective memberships
export const aiFollowerCollectiveMembers = pgTable("ai_follower_collective_members", {
  id: serial("id").primaryKey(),
  collectiveId: integer("collective_id").references(() => aiFollowerCollectives.id).notNull(),
  aiFollowerId: integer("ai_follower_id").references(() => ai_followers.id).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Relations for AI follower collectives
export const aiFollowerCollectivesRelations = relations(aiFollowerCollectives, ({ one, many }) => ({
  owner: one(users, {
    fields: [aiFollowerCollectives.userId],
    references: [users.id],
  }),
  members: many(aiFollowerCollectiveMembers),
}));

// Relations for AI follower collective members
export const aiFollowerCollectiveMembersRelations = relations(aiFollowerCollectiveMembers, ({ one }) => ({
  collective: one(aiFollowerCollectives, {
    fields: [aiFollowerCollectiveMembers.collectiveId],
    references: [aiFollowerCollectives.id],
  }),
  aiFollower: one(ai_followers, {
    fields: [aiFollowerCollectiveMembers.aiFollowerId],
    references: [ai_followers.id],
  }),
}));

// Insert schemas for collectives
export const insertAiFollowerCollectiveSchema = createInsertSchema(aiFollowerCollectives)
  .pick({
    name: true,
    description: true,
    personality: true,
  });

export const insertAiFollowerCollectiveMemberSchema = createInsertSchema(aiFollowerCollectiveMembers)
  .pick({
    collectiveId: true,
    aiFollowerId: true,
  });

// Type definitions for collectives
export type AiFollowerCollective = typeof aiFollowerCollectives.$inferSelect;
export type AiFollowerCollectiveMember = typeof aiFollowerCollectiveMembers.$inferSelect;
export type InsertAiFollowerCollective = z.infer<typeof insertAiFollowerCollectiveSchema>;
export type InsertAiFollowerCollectiveMember = z.infer<typeof insertAiFollowerCollectiveMemberSchema>;

// Table for content experiment labs
export const labs = pgTable("labs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  // Added circleId field to match the existing database schema, but make it nullable
  circleId: integer("circle_id").references(() => circles.id),
  experimentType: text("experiment_type", { 
    enum: ["a_b_test", "multivariate", "exploration"] 
  }).notNull(),
  status: text("status", { 
    enum: ["draft", "active", "completed", "archived"] 
  }).default("draft").notNull(),
  goals: text("goals"),
  successMetrics: json("success_metrics").$type<{
    metrics: Array<{
      name: string;
      target: number;
      priority: "high" | "medium" | "low";
    }>;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  launchedAt: timestamp("launched_at"),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Join table for labs and circles
export const labCircles = pgTable("lab_circles", {
  id: serial("id").primaryKey(),
  labId: integer("lab_id").references(() => labs.id).notNull(),
  circleId: integer("circle_id").references(() => circles.id).notNull(),
  role: text("role", { 
    enum: ["control", "treatment", "observation"] 
  }).default("treatment").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Relationships for labs
export const labsRelations = relations(labs, ({ one, many }) => ({
  owner: one(users, {
    fields: [labs.userId],
    references: [users.id],
  }),
  circles: many(labCircles),
  posts: many(posts),
}));

// Relationships for lab circles
export const labCirclesRelations = relations(labCircles, ({ one }) => ({
  lab: one(labs, {
    fields: [labCircles.labId],
    references: [labs.id],
  }),
  circle: one(circles, {
    fields: [labCircles.circleId],
    references: [circles.id],
  }),
}));

// Insert schemas for labs
export const insertLabSchema = createInsertSchema(labs)
  .pick({
    name: true,
    description: true,
    experimentType: true,
    goals: true,
    successMetrics: true,
    circleId: true, // Added circleId to allow direct association with a circle (optional)
  });

export const insertLabCircleSchema = createInsertSchema(labCircles)
  .pick({
    labId: true,
    circleId: true,
    role: true,
  });

// Type definitions for labs
export type Lab = typeof labs.$inferSelect;
export type LabCircle = typeof labCircles.$inferSelect;
export type InsertLab = z.infer<typeof insertLabSchema>;
export type InsertLabCircle = z.infer<typeof insertLabCircleSchema>;