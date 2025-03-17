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
export type PendingResponse = typeof pendingResponses.$inferSelect;