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

// New table for circle members with permission levels
export const circleMembers = pgTable("circle_members", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").references(() => circles.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role", { enum: ["owner", "collaborator", "viewer"] }).notNull(),
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
});

// Update posts table to include circle_id
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  circleId: integer("circle_id").references(() => circles.id),
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
});

export const pendingResponses = pgTable("pending_responses", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id),
  aiFollowerId: integer("ai_follower_id").references(() => ai_followers.id),
  scheduledFor: timestamp("scheduled_for").notNull(),
  processed: boolean("processed").notNull().default(false),
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

export const circlesRelations = relations(circles, ({ one, many }) => ({
  owner: one(users, {
    fields: [circles.userId],
    references: [users.id],
  }),
  followers: many(circleFollowers),
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

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  circle: one(circles, {
    fields: [posts.circleId],
    references: [circles.id],
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

export const insertCircleMemberSchema = createInsertSchema(circleMembers)
  .pick({
    circleId: true,
    userId: true,
    role: true,
  });

export const insertCircleInvitationSchema = createInsertSchema(circleInvitations)
  .pick({
    circleId: true,
    inviteeId: true,
    role: true,
  });

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
export type InsertCircleMember = z.infer<typeof insertCircleMemberSchema>;
export type CircleMember = typeof circleMembers.$inferSelect;
export type InsertCircleInvitation = z.infer<typeof insertCircleInvitationSchema>;
export type CircleInvitation = typeof circleInvitations.$inferSelect;