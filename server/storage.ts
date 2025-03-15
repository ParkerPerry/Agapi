import { InsertUser, User, Post, AiFollower, AiInteraction } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private aiFollowers: Map<number, AiFollower>;
  private aiInteractions: Map<number, AiInteraction>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.aiFollowers = new Map();
    this.aiInteractions = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPost(userId: number, content: string): Promise<Post> {
    const id = this.currentId++;
    const post: Post = {
      id,
      userId,
      content,
      createdAt: new Date(),
    };
    this.posts.set(id, post);
    return post;
  }

  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter((post) => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAiFollowers(userId: number): Promise<AiFollower[]> {
    return Array.from(this.aiFollowers.values()).filter(
      (follower) => follower.userId === userId,
    );
  }

  async createAiFollower(
    userId: number,
    follower: Omit<AiFollower, "id" | "userId">,
  ): Promise<AiFollower> {
    const id = this.currentId++;
    const aiFollower: AiFollower = { ...follower, id, userId };
    this.aiFollowers.set(id, aiFollower);
    return aiFollower;
  }

  async createAiInteraction(
    interaction: Omit<AiInteraction, "id" | "createdAt">,
  ): Promise<AiInteraction> {
    const id = this.currentId++;
    const aiInteraction: AiInteraction = {
      ...interaction,
      id,
      createdAt: new Date(),
    };
    this.aiInteractions.set(id, aiInteraction);
    return aiInteraction;
  }

  async getPostInteractions(postId: number): Promise<AiInteraction[]> {
    return Array.from(this.aiInteractions.values())
      .filter((interaction) => interaction.postId === postId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
