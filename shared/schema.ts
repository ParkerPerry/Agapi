import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiFollowers = pgTable("ai_followers", {
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
});

export const aiInteractions = pgTable("ai_interactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id),
  aiFollowerId: integer("ai_follower_id").references(() => aiFollowers.id),
  userId: integer("user_id").references(() => users.id), // Added to track user replies
  type: text("type", { enum: ["like", "comment", "reply"] }).notNull(),
  content: text("content"),
  parentId: integer("parent_id").references(() => aiInteractions.id), // Self-reference for thread replies
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  content: true,
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