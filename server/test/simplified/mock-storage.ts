/**
 * Simple mock storage for tests
 * This doesn't need to implement the full IStorage interface
 */

export interface MockUser {
  id: number;
  username: string;
  password: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date | null;
}

export interface MockPost {
  id: number;
  content: string;
  userId: number | null;
  circleId: number | null;
  createdAt: Date | null;
}

export interface MockFollower {
  id: number;
  name: string;
  userId: number | null;
  avatarUrl: string;
  personality: string;
  active: boolean;
}

export interface MockCircle {
  id: number;
  name: string;
  userId: number;
  description: string | null;
  visibility: 'private' | 'shared';
  createdAt: Date | null;
}

/**
 * Very simple in-memory mock storage
 */
export class SimpleMockStorage {
  private users: MockUser[] = [];
  private posts: MockPost[] = [];
  private followers: MockFollower[] = [];
  private circles: MockCircle[] = [];
  
  // User methods
  async createUser(userData: Omit<MockUser, 'id'>): Promise<MockUser> {
    const id = this.users.length + 1;
    const user = { ...userData, id };
    this.users.push(user);
    return user;
  }
  
  async getUser(id: number): Promise<MockUser | null> {
    return this.users.find(u => u.id === id) || null;
  }
  
  async getUserByUsername(username: string): Promise<MockUser | null> {
    return this.users.find(u => u.username === username) || null;
  }
  
  // Post methods
  async createPost(postData: Omit<MockPost, 'id'>): Promise<MockPost> {
    const id = this.posts.length + 1;
    const post = { ...postData, id };
    this.posts.push(post);
    return post;
  }
  
  async getPost(id: number): Promise<MockPost | null> {
    return this.posts.find(p => p.id === id) || null;
  }
  
  async getUserPosts(userId: number): Promise<MockPost[]> {
    return this.posts.filter(p => p.userId === userId);
  }
  
  // Follower methods
  async createFollower(followerData: Omit<MockFollower, 'id'>): Promise<MockFollower> {
    const id = this.followers.length + 1;
    const follower = { ...followerData, id };
    this.followers.push(follower);
    return follower;
  }
  
  async getFollower(id: number): Promise<MockFollower | null> {
    return this.followers.find(f => f.id === id) || null;
  }
  
  async getUserFollowers(userId: number): Promise<MockFollower[]> {
    return this.followers.filter(f => f.userId === userId);
  }
  
  // Circle methods
  async createCircle(circleData: Omit<MockCircle, 'id'>): Promise<MockCircle> {
    const id = this.circles.length + 1;
    const circle = { ...circleData, id };
    this.circles.push(circle);
    return circle;
  }
  
  async getCircle(id: number): Promise<MockCircle | null> {
    return this.circles.find(c => c.id === id) || null;
  }
  
  async getUserCircles(userId: number): Promise<MockCircle[]> {
    return this.circles.filter(c => c.userId === userId);
  }
  
  // Data access for testing
  clearAll() {
    this.users = [];
    this.posts = [];
    this.followers = [];
    this.circles = [];
  }
}