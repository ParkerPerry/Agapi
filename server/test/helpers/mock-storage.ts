/**
 * Mock storage class for testing
 * Provides an in-memory implementation of the storage interface for tests
 */

import { IStorage } from '../../storage';
import { 
  User, Post, AiFollower, AiInteraction, Circle, CircleMember,
  Lab, LabCircle, LabCircleRole, AiFollowerCollective, Notification
} from '@shared/schema';
import { createTestUser, createTestFollower, createTestPost, createTestCircle } from './test-factories';

/**
 * Mock storage interface for tests
 * This class provides a simplified storage implementation that can be easily mocked
 * For full test compatibility, we include stubs for all methods in the IStorage interface
 */
export class MockStorage implements IStorage {
  private users: User[] = [];
  private posts: Post[] = [];
  private followers: AiFollower[] = [];
  private interactions: AiInteraction[] = [];
  private circles: Circle[] = [];
  private circleMembers: CircleMember[] = [];
  private labs: Lab[] = [];
  private labCircles: LabCircle[] = [];
  private labCircleRoles: LabCircleRole[] = [];
  private collectives: AiFollowerCollective[] = [];
  private notifications: Notification[] = [];

  constructor() {
    // Add some initial test data
    this.users.push(createTestUser({ id: 1, username: 'testuser' }));
    this.posts.push(createTestPost({ id: 1, userId: 1 }));
    this.followers.push(createTestFollower({ id: 1, userId: 1 }));
    this.circles.push(createTestCircle({ id: 1, userId: 1 }));
  }

  // User methods
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const newUser: User = {
      id: this.users.length + 1,
      ...userData
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUserById(id: number): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.users.find(user => user.username === username) || null;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return this.users[userIndex];
  }

  // AI Follower methods
  async createAiFollower(followerData: Omit<AiFollower, 'id'>): Promise<AiFollower> {
    const newFollower: AiFollower = {
      id: this.followers.length + 1,
      ...followerData
    };
    this.followers.push(newFollower);
    return newFollower;
  }

  async getAiFollowers(userId: number): Promise<AiFollower[]> {
    return this.followers.filter(follower => follower.userId === userId);
  }

  async getAiFollowerById(id: number): Promise<AiFollower | null> {
    return this.followers.find(follower => follower.id === id) || null;
  }

  async updateAiFollower(id: number, updates: Partial<AiFollower>): Promise<AiFollower | null> {
    const followerIndex = this.followers.findIndex(follower => follower.id === id);
    if (followerIndex === -1) return null;
    
    this.followers[followerIndex] = { ...this.followers[followerIndex], ...updates };
    return this.followers[followerIndex];
  }

  async deleteAiFollower(id: number): Promise<boolean> {
    const initialLength = this.followers.length;
    this.followers = this.followers.filter(follower => follower.id !== id);
    return initialLength > this.followers.length;
  }

  async deactivateAiFollower(id: number): Promise<boolean> {
    const follower = await this.getAiFollowerById(id);
    if (!follower) return false;
    
    await this.updateAiFollower(id, { active: false });
    return true;
  }

  async reactivateAiFollower(id: number): Promise<boolean> {
    const follower = await this.getAiFollowerById(id);
    if (!follower) return false;
    
    await this.updateAiFollower(id, { active: true });
    return true;
  }

  // Post methods
  async createPost(postData: Omit<Post, 'id'>): Promise<Post> {
    const newPost: Post = {
      id: this.posts.length + 1,
      ...postData
    };
    this.posts.push(newPost);
    return newPost;
  }

  async getPosts(userId: number, limit = 10, offset = 0): Promise<Post[]> {
    return this.posts
      .filter(post => post.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  async getPostById(id: number): Promise<Post | null> {
    return this.posts.find(post => post.id === id) || null;
  }

  async deletePost(id: number): Promise<boolean> {
    const initialLength = this.posts.length;
    this.posts = this.posts.filter(post => post.id !== id);
    return initialLength > this.posts.length;
  }

  // Circle methods
  async createCircle(circleData: Omit<Circle, 'id'>): Promise<Circle> {
    const newCircle: Circle = {
      id: this.circles.length + 1,
      ...circleData
    };
    this.circles.push(newCircle);
    return newCircle;
  }

  async getCircles(userId: number): Promise<Circle[]> {
    return this.circles.filter(circle => circle.userId === userId);
  }

  async getCircleById(id: number): Promise<Circle | null> {
    return this.circles.find(circle => circle.id === id) || null;
  }

  async updateCircle(id: number, updates: Partial<Circle>): Promise<Circle | null> {
    const circleIndex = this.circles.findIndex(circle => circle.id === id);
    if (circleIndex === -1) return null;
    
    this.circles[circleIndex] = { ...this.circles[circleIndex], ...updates };
    return this.circles[circleIndex];
  }

  async deleteCircle(id: number): Promise<boolean> {
    const initialLength = this.circles.length;
    this.circles = this.circles.filter(circle => circle.id !== id);
    return initialLength > this.circles.length;
  }

  async hasCirclePermission(userId: number, circleId: number, requiredRole?: string): Promise<boolean> {
    const circleMember = this.circleMembers.find(
      member => member.circleId === circleId && member.userId === userId
    );
    
    if (!circleMember) return false;
    if (!requiredRole) return true;
    
    // Check if the user has the required role or higher
    const roles = ['viewer', 'member', 'moderator', 'admin', 'owner'];
    const userRoleIndex = roles.indexOf(circleMember.role);
    const requiredRoleIndex = roles.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
  }

  // Circle Member methods
  async addCircleMember(memberData: Omit<CircleMember, 'id'>): Promise<CircleMember> {
    const newMember: CircleMember = {
      id: this.circleMembers.length + 1,
      ...memberData
    };
    this.circleMembers.push(newMember);
    return newMember;
  }

  async getCircleMembers(circleId: number): Promise<CircleMember[]> {
    return this.circleMembers.filter(member => member.circleId === circleId);
  }

  async updateCircleMember(id: number, updates: Partial<CircleMember>): Promise<CircleMember | null> {
    const memberIndex = this.circleMembers.findIndex(member => member.id === id);
    if (memberIndex === -1) return null;
    
    this.circleMembers[memberIndex] = { ...this.circleMembers[memberIndex], ...updates };
    return this.circleMembers[memberIndex];
  }

  async removeCircleMember(id: number): Promise<boolean> {
    const initialLength = this.circleMembers.length;
    this.circleMembers = this.circleMembers.filter(member => member.id !== id);
    return initialLength > this.circleMembers.length;
  }

  // AI Interaction methods
  async createAiInteraction(interactionData: Omit<AiInteraction, 'id'>): Promise<AiInteraction> {
    const newInteraction: AiInteraction = {
      id: this.interactions.length + 1,
      ...interactionData
    };
    this.interactions.push(newInteraction);
    return newInteraction;
  }

  async getAiInteractions(postId: number): Promise<AiInteraction[]> {
    return this.interactions.filter(interaction => interaction.postId === postId);
  }

  async getAiInteractionById(id: number): Promise<AiInteraction | null> {
    return this.interactions.find(interaction => interaction.id === id) || null;
  }

  // Lab methods
  async createLab(labData: Omit<Lab, 'id'>): Promise<Lab> {
    const newLab: Lab = {
      id: this.labs.length + 1,
      ...labData
    };
    this.labs.push(newLab);
    return newLab;
  }

  async getLabs(userId: number): Promise<Lab[]> {
    return this.labs.filter(lab => lab.userId === userId);
  }

  async getLabById(id: number): Promise<Lab | null> {
    return this.labs.find(lab => lab.id === id) || null;
  }

  // AI Follower Collective methods
  async createAiFollowerCollective(collectiveData: Omit<AiFollowerCollective, 'id'>): Promise<AiFollowerCollective> {
    const newCollective: AiFollowerCollective = {
      id: this.collectives.length + 1,
      ...collectiveData
    };
    this.collectives.push(newCollective);
    return newCollective;
  }

  async getAiFollowerCollectivesByCircleId(circleId: number): Promise<AiFollowerCollective[]> {
    return this.collectives.filter(collective => collective.circleId === circleId);
  }

  // Notification methods
  async createNotification(notificationData: Omit<Notification, 'id'>): Promise<Notification> {
    const newNotification: Notification = {
      id: this.notifications.length + 1,
      ...notificationData
    };
    this.notifications.push(newNotification);
    return newNotification;
  }

  async getNotifications(userId: number, limit = 10, offset = 0): Promise<Notification[]> {
    return this.notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notificationIndex = this.notifications.findIndex(notification => notification.id === id);
    if (notificationIndex === -1) return false;
    
    this.notifications[notificationIndex].read = true;
    return true;
  }

  // Stubs for remaining methods to satisfy the interface
  // These are minimal implementations that can be extended as needed for specific tests
  
  async getPostPendingResponses(_postId: number): Promise<any[]> {
    return [];
  }
  
  async createPostPendingResponse(_data: any): Promise<any> {
    return { id: 1 };
  }
  
  async updatePostPendingResponse(_id: number, _data: any): Promise<any> {
    return { id: 1 };
  }
  
  async deletePostPendingResponse(_id: number): Promise<boolean> {
    return true;
  }
  
  async createLabCircle(_data: any): Promise<any> {
    return { id: 1 };
  }
  
  async getLabCircles(_labId: number): Promise<any[]> {
    return [];
  }
  
  async updateLabCircle(_id: number, _data: any): Promise<any> {
    return { id: 1 };
  }
  
  async createLabCircleRole(_data: any): Promise<any> {
    return { id: 1 };
  }
  
  async getLabCircleRoles(_labCircleId: number): Promise<any[]> {
    return [];
  }
  
  async updateLabCircleRole(_id: number, _data: any): Promise<any> {
    return { id: 1 };
  }
  
  async getDirectChatHistory(_userId: number, _aiFollowerId: number): Promise<any[]> {
    return [];
  }
  
  async createDirectChatMessage(_data: any): Promise<any> {
    return { id: 1 };
  }
  
  async clearDirectChatHistory(_userId: number, _aiFollowerId: number): Promise<boolean> {
    return true;
  }
  
  async createCirclePost(_data: any): Promise<any> {
    return { id: 1 };
  }
  
  async getCirclePosts(_circleId: number): Promise<any[]> {
    return [];
  }
  
  async updateCirclePost(_id: number, _data: any): Promise<any> {
    return { id: 1 };
  }
  
  async deleteCirclePost(_id: number): Promise<boolean> {
    return true;
  }
  
  async createUserCircleSubscription(_userId: number, _circleId: number): Promise<any> {
    return { id: 1 };
  }
  
  async getUserCircleSubscriptions(_userId: number): Promise<any[]> {
    return [];
  }
  
  async deleteUserCircleSubscription(_userId: number, _circleId: number): Promise<boolean> {
    return true;
  }

  async addAiFollowerToCircle(_followerId: number, _circleId: number): Promise<any> {
    return { id: 1 };
  }
  
  async removeAiFollowerFromCircle(_followerId: number, _circleId: number): Promise<boolean> {
    return true;
  }
  
  async getAiFollowersByCircleId(_circleId: number): Promise<any[]> {
    return [];
  }
  
  async getUserUnreadNotificationsCount(_userId: number): Promise<number> {
    return 0;
  }
  
  async markAllNotificationsAsRead(_userId: number): Promise<boolean> {
    return true;
  }
  
  async deleteNotification(_id: number): Promise<boolean> {
    return true;
  }
  
  async getNotificationById(_id: number): Promise<any | null> {
    return null;
  }
  
  async getPostsWithPendingResponses(): Promise<any[]> {
    return [];
  }
  
  async getAiFollowerPostResponses(_postId: number, _aiFollowerId: number): Promise<any[]> {
    return [];
  }
  
  async updateLab(_id: number, _data: any): Promise<any | null> {
    return null;
  }
  
  async deleteLab(_id: number): Promise<boolean> {
    return true;
  }

  async createActivity(_data: any): Promise<any> {
    return { id: 1 };
  }

  async getActivities(_userId: number, _limit?: number, _offset?: number): Promise<any[]> {
    return [];
  }

  async getActivityById(_id: number): Promise<any | null> {
    return null;
  }

  async deleteActivity(_id: number): Promise<boolean> {
    return true;
  }

  async getPostsByFollowerId(_followerId: number): Promise<any[]> {
    return [];
  }
  
  // Add additional stub methods as needed to match the IStorage interface
}

// Create a singleton instance for use in tests
export const mockStorage = new MockStorage();