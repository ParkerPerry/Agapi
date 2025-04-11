/**
 * Test-specific mock implementation of the storage interface
 * This provides type-safe mocking for storage operations during tests
 */

import { IStorage } from '../../storage';
import { 
  User, InsertUser, Post, AiFollower, AiInteraction, PendingResponse,
  Circle, InsertCircle, CircleMember, CircleFollower, CircleCollective
} from '@shared/schema';

/**
 * MockStorage implements the IStorage interface for testing
 * All methods return mocked values and can be spied on with jest.spyOn
 */
export class MockStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    return {
      id: 1,
      username: user.username,
      password: user.password,
      avatarUrl: null,
      bio: null,
      createdAt: new Date().toISOString()
    };
  }

  async updateUser(id: number, updates: Partial<Pick<User, "avatarUrl" | "bio">>): Promise<User> {
    return {
      id,
      username: 'testuser',
      password: 'password',
      avatarUrl: updates.avatarUrl || null,
      bio: updates.bio || null,
      createdAt: new Date().toISOString()
    };
  }

  // Post operations
  async createPost(userId: number, content: string): Promise<Post> {
    return {
      id: 1,
      userId,
      content,
      createdAt: new Date().toISOString()
    };
  }

  async getPost(id: number): Promise<Post | undefined> {
    return undefined;
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    return [];
  }

  // AI Follower operations
  async getAiFollowers(userId: number): Promise<(AiFollower & { parentName?: string })[]> {
    return [];
  }

  async getAiFollower(id: number): Promise<AiFollower | undefined> {
    return undefined;
  }

  async createAiFollower(userId: number, follower: Omit<AiFollower, "id" | "userId">): Promise<AiFollower> {
    return {
      id: 1,
      userId,
      name: follower.name,
      personality: follower.personality || '',
      background: follower.background || null,
      communicationStyle: follower.communicationStyle || null,
      parentId: follower.parentId || null,
      responsiveness: follower.responsiveness || null,
      avatarUrl: follower.avatarUrl || null,
      interests: follower.interests || null,
      likes: follower.likes || null,
      dislikes: follower.dislikes || null,
      tools: follower.tools || null,
      active: true,
      createdAt: new Date().toISOString()
    };
  }

  async updateAiFollower(id: number, updates: Partial<Pick<AiFollower, "name" | "personality" | "responsiveness" | "background" | "communicationStyle" | "tools">>): Promise<AiFollower> {
    return {
      id,
      userId: 1,
      name: updates.name || 'Test AI',
      personality: updates.personality || '',
      background: updates.background || null,
      communicationStyle: updates.communicationStyle || null,
      parentId: null,
      responsiveness: updates.responsiveness || null,
      avatarUrl: null,
      interests: null,
      likes: null,
      dislikes: null,
      tools: updates.tools || null,
      active: true,
      createdAt: new Date().toISOString()
    };
  }

  // AI Interaction operations
  async createAiInteraction(interaction: Omit<AiInteraction, "id" | "createdAt">): Promise<AiInteraction> {
    return {
      id: 1,
      postId: interaction.postId,
      aiFollowerId: interaction.aiFollowerId,
      userId: interaction.userId,
      type: interaction.type,
      content: interaction.content || null,
      parentId: interaction.parentId || null,
      createdAt: new Date().toISOString(),
      toolsUsed: interaction.toolsUsed || null
    };
  }

  async getInteraction(id: number): Promise<AiInteraction | undefined> {
    return undefined;
  }

  async getPostInteractions(postId: number): Promise<AiInteraction[]> {
    return [];
  }

  // Pending response operations
  async createPendingResponse(response: Omit<PendingResponse, "id" | "createdAt">): Promise<PendingResponse> {
    return {
      id: 1,
      postId: response.postId,
      aiFollowerId: response.aiFollowerId,
      scheduledFor: response.scheduledFor,
      processed: response.processed,
      metadata: response.metadata || null,
      createdAt: new Date().toISOString()
    };
  }

  async getPendingResponses(): Promise<PendingResponse[]> {
    return [];
  }

  async markPendingResponseProcessed(id: number): Promise<void> {
    return;
  }

  // Follower preferences operations
  async updateFollowerInterests(id: number, interests: string[]): Promise<void> {
    return;
  }

  async updateFollowerInteractionPreferences(id: number, likes: string[], dislikes: string[]): Promise<void> {
    return;
  }

  // Circle operations
  async getCircle(id: number): Promise<Circle | undefined> {
    return undefined;
  }

  async getUserCircles(userId: number): Promise<{ owned: Circle[]; shared: Circle[]; invited: Circle[] }> {
    return {
      owned: [],
      shared: [],
      invited: []
    };
  }

  async createCircle(userId: number, circle: InsertCircle): Promise<Circle> {
    return {
      id: 1,
      name: circle.name,
      description: circle.description || null,
      icon: circle.icon || null,
      color: circle.color || null,
      userId,
      isDefault: circle.isDefault || false,
      visibility: circle.visibility || 'private',
      createdAt: new Date().toISOString()
    };
  }

  async updateCircle(id: number, updates: Partial<InsertCircle>): Promise<Circle> {
    return {
      id,
      name: updates.name || 'Test Circle',
      description: updates.description || null,
      icon: updates.icon || null,
      color: updates.color || null,
      userId: 1,
      isDefault: updates.isDefault || false,
      visibility: updates.visibility || 'private',
      createdAt: new Date().toISOString()
    };
  }

  async getCircleMembers(circleId: number): Promise<CircleMember[]> {
    return [];
  }

  async getCircleFollowers(circleId: number): Promise<(AiFollower & { followerType: 'follower' | 'collective' })[]> {
    return [];
  }

  // Circle permission check - this was missing in the original interface
  async hasCirclePermission(userId: number, circleId: number): Promise<boolean> {
    return userId === 1; // Default: user 1 has permission
  }
}

// Create a singleton instance for consistent mocking
export const mockStorage = new MockStorage();