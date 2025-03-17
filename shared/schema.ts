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

// New circles table
export const circles = pgTable("circles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
});

// Join table for circles and AI followers
export const circleFollowers = pgTable("circle_followers", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").references(() => circles.id).notNull(),
  aiFollowerId: integer("ai_follower_id").references(() => aiFollowers.id).notNull(),
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

// Rest of the existing tables remain unchanged
export const aiFollowers = pgTable("aiFollowers", {
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
  aiFollowerId: integer("ai_follower_id").references(() => aiFollowers.id),
  scheduledFor: timestamp("scheduled_for").notNull(),
  processed: boolean("processed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiInteractions = pgTable("ai_interactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id),
  aiFollowerId: integer("ai_follower_id").references(() => aiFollowers.id),
  userId: integer("user_id").references(() => users.id),
  type: text("type", { enum: ["like", "comment", "reply"] }).notNull(),
  content: text("content"),
  parentId: integer("parent_id").references(() => aiInteractions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiInteractionsRelations = relations(aiInteractions, ({ one }) => ({
  parent: one(aiInteractions, {
    fields: [aiInteractions.parentId],
    references: [aiInteractions.id],
  }),
  aiFollower: one(aiFollowers, {
    fields: [aiInteractions.aiFollowerId],
    references: [aiFollowers.id],
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
}));

export const circleFollowersRelations = relations(circleFollowers, ({ one }) => ({
  circle: one(circles, {
    fields: [circleFollowers.circleId],
    references: [circles.id],
  }),
  aiFollower: one(aiFollowers, {
    fields: [circleFollowers.aiFollowerId],
    references: [aiFollowers.id],
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type AiFollower = typeof aiFollowers.$inferSelect;
export type AiInteraction = typeof aiInteractions.$inferSelect;
export type PendingResponse = typeof pendingResponses.$inferSelect;
export type Circle = typeof circles.$inferSelect;
export type InsertCircle = z.infer<typeof insertCircleSchema>;
export type CircleFollower = typeof circleFollowers.$inferSelect;
export type InsertCircleFollower = z.infer<typeof insertCircleFollowerSchema>;