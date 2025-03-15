import { InsertUser, User, Post, AiFollower, AiInteraction } from "@shared/schema";
import { users, posts, aiFollowers, aiInteractions } from "@shared/schema";
import session from "express-session";
import { eq } from "drizzle-orm";
import { db } from "./db";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createPost(userId: number, content: string): Promise<Post>;
  getPost(id: number): Promise<Post | undefined>;
  getUserPosts(userId: number): Promise<Post[]>;

  getAiFollowers(userId: number): Promise<AiFollower[]>;
  createAiFollower(userId: number, follower: Omit<AiFollower, "id" | "userId">): Promise<AiFollower>;

  createAiInteraction(interaction: Omit<AiInteraction, "id" | "createdAt">): Promise<AiInteraction>;
  getPostInteractions(postId: number): Promise<AiInteraction[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createPost(userId: number, content: string): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({ userId, content })
      .returning();
    return post;
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(posts.createdAt);
  }

  async getAiFollowers(userId: number): Promise<AiFollower[]> {
    return await db
      .select()
      .from(aiFollowers)
      .where(eq(aiFollowers.userId, userId));
  }

  async createAiFollower(
    userId: number,
    follower: Omit<AiFollower, "id" | "userId">,
  ): Promise<AiFollower> {
    const [aiFollower] = await db
      .insert(aiFollowers)
      .values({ ...follower, userId })
      .returning();
    return aiFollower;
  }

  async createAiInteraction(
    interaction: Omit<AiInteraction, "id" | "createdAt">,
  ): Promise<AiInteraction> {
    const [aiInteraction] = await db
      .insert(aiInteractions)
      .values(interaction)
      .returning();
    return aiInteraction;
  }

  async getPostInteractions(postId: number): Promise<AiInteraction[]> {
    return await db
      .select()
      .from(aiInteractions)
      .where(eq(aiInteractions.postId, postId))
      .orderBy(aiInteractions.createdAt);
  }
}

export const storage = new DatabaseStorage();