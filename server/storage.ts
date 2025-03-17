import { 
  InsertUser, User, Post, AiFollower, AiInteraction, PendingResponse,
  Circle, InsertCircle, CircleFollower, InsertCircleFollower
} from "@shared/schema";
import { 
  users, posts, ai_followers, aiInteractions, pendingResponses,
  circles, circleFollowers
} from "@shared/schema";
import { eq, and, asc } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createPost(userId: number, content: string): Promise<Post>;
  getPost(id: number): Promise<Post | undefined>;
  getUserPosts(userId: number): Promise<Post[]>;
  getAiFollowers(userId: number): Promise<AiFollower[]>;
  getAiFollower(id: number): Promise<AiFollower | undefined>;
  createAiFollower(userId: number, follower: Omit<AiFollower, "id" | "userId">): Promise<AiFollower>;
  createAiInteraction(interaction: Omit<AiInteraction, "id" | "createdAt">): Promise<AiInteraction>;
  getInteraction(id: number): Promise<AiInteraction | undefined>;
  getPostInteractions(postId: number): Promise<AiInteraction[]>;
  createPendingResponse(response: Omit<PendingResponse, "id" | "createdAt">): Promise<PendingResponse>;
  getPendingResponses(): Promise<PendingResponse[]>;
  markPendingResponseProcessed(id: number): Promise<void>;
  updateAiFollower(id: number, updates: Partial<Pick<AiFollower, "name" | "personality" | "responsiveness">>): Promise<AiFollower>;
  deleteAiFollower(id: number): Promise<void>;
  deactivateAiFollower(id: number): Promise<AiFollower>;
  reactivateAiFollower(id: number): Promise<AiFollower>;
  getPostPendingResponses(postId: number): Promise<PendingResponse[]>;

  createCircle(userId: number, circle: InsertCircle): Promise<Circle>;
  getCircle(id: number): Promise<Circle | undefined>;
  getUserCircles(userId: number): Promise<Circle[]>;
  updateCircle(id: number, updates: Partial<InsertCircle>): Promise<Circle>;
  deleteCircle(id: number): Promise<void>;
  getDefaultCircle(userId: number): Promise<Circle>;
  addFollowerToCircle(circleId: number, aiFollowerId: number): Promise<CircleFollower>;
  removeFollowerFromCircle(circleId: number, aiFollowerId: number): Promise<void>;
  getCircleFollowers(circleId: number): Promise<AiFollower[]>;
  createPostInCircle(userId: number, circleId: number, content: string): Promise<Post>;
  getCirclePosts(circleId: number): Promise<Post[]>;
  movePostToCircle(postId: number, circleId: number): Promise<Post>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = (await db.insert(users).values(insertUser).returning()) as User[];
    return user;
  }

  async createPost(userId: number, content: string): Promise<Post> {
    const [post] = (await db
      .insert(posts)
      .values({ userId, content })
      .returning()) as Post[];
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
      .from(ai_followers)
      .where(eq(ai_followers.userId, userId));
  }

  async getAiFollower(id: number): Promise<AiFollower | undefined> {
    const [follower] = await db
      .select()
      .from(ai_followers)
      .where(eq(ai_followers.id, id));
    return follower;
  }

  async createAiFollower(
    userId: number,
    follower: Omit<AiFollower, "id" | "userId">,
  ): Promise<AiFollower> {
    const [aiFollower] = (await db
      .insert(ai_followers)
      .values({ ...follower, userId })
      .returning()) as AiFollower[];
    return aiFollower;
  }

  async createAiInteraction(
    interaction: Omit<AiInteraction, "id" | "createdAt">,
  ): Promise<AiInteraction> {
    console.log("[Storage] Creating AI interaction:", {
      postId: interaction.postId,
      userId: interaction.userId,
      aiFollowerId: interaction.aiFollowerId,
      type: interaction.type,
      parentId: interaction.parentId
    });

    try {
      const [aiInteraction] = (await db
        .insert(aiInteractions)
        .values(interaction)
        .returning()) as AiInteraction[];

      console.log("[Storage] Created AI interaction:", {
        id: aiInteraction.id,
        type: aiInteraction.type,
        userId: aiInteraction.userId,
        aiFollowerId: aiInteraction.aiFollowerId
      });

      return aiInteraction;
    } catch (error) {
      console.error("[Storage] Error creating AI interaction:", error);
      throw error;
    }
  }

  async getInteraction(id: number): Promise<AiInteraction | undefined> {
    console.log("[Storage] Getting interaction by ID:", id);

    try {
      const [interaction] = await db
        .select()
        .from(aiInteractions)
        .where(eq(aiInteractions.id, id));

      if (interaction) {
        console.log("[Storage] Retrieved interaction:", {
          id: interaction.id,
          type: interaction.type,
          userId: interaction.userId,
          aiFollowerId: interaction.aiFollowerId,
          parentId: interaction.parentId
        });

        return interaction as AiInteraction;
      }

      console.log("[Storage] Interaction not found");
      return undefined;
    } catch (error) {
      console.error("[Storage] Error getting interaction:", error);
      throw error;
    }
  }

  async getPostInteractions(postId: number): Promise<AiInteraction[]> {
    console.log("[Storage] Getting interactions for post:", postId);

    try {
      const interactions = await db
        .select()
        .from(aiInteractions)
        .where(eq(aiInteractions.postId, postId))
        .orderBy(aiInteractions.createdAt);

      console.log("[Storage] Retrieved interactions count:", interactions.length);

      return interactions as AiInteraction[];
    } catch (error) {
      console.error("[Storage] Error getting post interactions:", error);
      throw error;
    }
  }

  async createPendingResponse(
    response: Omit<PendingResponse, "id" | "createdAt">
  ): Promise<PendingResponse> {
    console.log("[Storage] Creating pending response:", {
      postId: response.postId,
      aiFollowerId: response.aiFollowerId,
      scheduledFor: response.scheduledFor
    });

    try {
      const [pendingResponse] = (await db
        .insert(pendingResponses)
        .values(response)
        .returning()) as PendingResponse[];

      console.log("[Storage] Created pending response:", {
        id: pendingResponse.id,
        scheduledFor: pendingResponse.scheduledFor
      });

      return pendingResponse;
    } catch (error) {
      console.error("[Storage] Error creating pending response:", error);
      throw error;
    }
  }

  async getPendingResponses(): Promise<PendingResponse[]> {
    try {
      return await db
        .select()
        .from(pendingResponses)
        .where(eq(pendingResponses.processed, false))
        .orderBy(pendingResponses.scheduledFor);
    } catch (error) {
      console.error("[Storage] Error getting pending responses:", error);
      throw error;
    }
  }

  async markPendingResponseProcessed(id: number): Promise<void> {
    try {
      await db
        .update(pendingResponses)
        .set({ processed: true })
        .where(eq(pendingResponses.id, id));
    } catch (error) {
      console.error("[Storage] Error marking pending response as processed:", error);
      throw error;
    }
  }

  async updateAiFollower(
    id: number,
    updates: Partial<Pick<AiFollower, "name" | "personality" | "responsiveness">>
  ): Promise<AiFollower> {
    try {
      const [updatedFollower] = (await db
        .update(ai_followers)
        .set(updates)
        .where(eq(ai_followers.id, id))
        .returning()) as AiFollower[];

      return updatedFollower;
    } catch (error) {
      console.error("[Storage] Error updating AI follower:", error);
      throw error;
    }
  }

  async deleteAiFollower(id: number): Promise<void> {
    try {
      console.log("[Storage] Starting deletion of AI follower and related interactions:", id);

      // First get all interactions by this follower
      const followerInteractions = await db
        .select()
        .from(aiInteractions)
        .where(eq(aiInteractions.aiFollowerId, id));

      console.log("[Storage] Found interactions to delete:", followerInteractions.length);

      // Delete child interactions (replies) first
      await db
        .delete(aiInteractions)
        .where(
          eq(aiInteractions.parentId,
            db.select({ id: aiInteractions.id })
              .from(aiInteractions)
              .where(eq(aiInteractions.aiFollowerId, id))
          )
        );

      console.log("[Storage] Deleted child interactions");

      // Then delete the follower's own interactions
      await db
        .delete(aiInteractions)
        .where(eq(aiInteractions.aiFollowerId, id));

      console.log("[Storage] Deleted follower's interactions");

      // Delete pending responses
      await db
        .delete(pendingResponses)
        .where(eq(pendingResponses.aiFollowerId, id));

      console.log("[Storage] Deleted pending responses");

      // Finally delete the follower
      await db
        .delete(ai_followers)
        .where(eq(ai_followers.id, id));

      console.log("[Storage] Successfully deleted AI follower and related data");
    } catch (error) {
      console.error("[Storage] Error deleting AI follower:", error);
      throw error;
    }
  }

  async deactivateAiFollower(id: number): Promise<AiFollower> {
    try {
      console.log("[Storage] Deactivating AI follower:", id);

      const [updatedFollower] = (await db
        .update(ai_followers)
        .set({ active: false })
        .where(eq(ai_followers.id, id))
        .returning()) as AiFollower[];

      console.log("[Storage] Successfully deactivated AI follower:", id);
      return updatedFollower;
    } catch (error) {
      console.error("[Storage] Error deactivating AI follower:", error);
      throw error;
    }
  }

  async reactivateAiFollower(id: number): Promise<AiFollower> {
    try {
      console.log("[Storage] Reactivating AI follower:", id);

      const [updatedFollower] = (await db
        .update(ai_followers)
        .set({ active: true })
        .where(eq(ai_followers.id, id))
        .returning()) as AiFollower[];

      console.log("[Storage] Successfully reactivated AI follower:", id);
      return updatedFollower;
    } catch (error) {
      console.error("[Storage] Error reactivating AI follower:", error);
      throw error;
    }
  }

  async getPostPendingResponses(postId: number): Promise<PendingResponse[]> {
    console.log("[Storage] Getting pending responses for post:", postId);

    try {
      const responses = await db
        .select()
        .from(pendingResponses)
        .where(
          and(
            eq(pendingResponses.postId, postId),
            eq(pendingResponses.processed, false)
          )
        )
        .orderBy(pendingResponses.scheduledFor);

      console.log("[Storage] Found pending responses for post", postId, ":", responses);
      return responses;
    } catch (error) {
      console.error("[Storage] Error getting post pending responses:", error);
      throw error;
    }
  }

  async createCircle(userId: number, circle: InsertCircle): Promise<Circle> {
    const [newCircle] = (await db
      .insert(circles)
      .values({ ...circle, userId })
      .returning()) as Circle[];
    return newCircle;
  }

  async getCircle(id: number): Promise<Circle | undefined> {
    const [circle] = await db.select().from(circles).where(eq(circles.id, id));
    return circle;
  }

  async getUserCircles(userId: number): Promise<Circle[]> {
    return await db
      .select()
      .from(circles)
      .where(eq(circles.userId, userId))
      .orderBy(asc(circles.createdAt));
  }

  async updateCircle(id: number, updates: Partial<InsertCircle>): Promise<Circle> {
    const [updatedCircle] = (await db
      .update(circles)
      .set(updates)
      .where(eq(circles.id, id))
      .returning()) as Circle[];
    return updatedCircle;
  }

  async deleteCircle(id: number): Promise<void> {
    // First move all posts to the default circle
    const [defaultCircle] = await db
      .select()
      .from(circles)
      .where(and(
        eq(circles.userId, (await this.getCircle(id))!.userId),
        eq(circles.isDefault, true)
      ));

    await db
      .update(posts)
      .set({ circleId: defaultCircle.id })
      .where(eq(posts.circleId, id));

    // Remove all followers from the circle
    await db
      .delete(circleFollowers)
      .where(eq(circleFollowers.circleId, id));

    // Finally delete the circle
    await db
      .delete(circles)
      .where(eq(circles.id, id));
  }

  async getDefaultCircle(userId: number): Promise<Circle> {
    let [defaultCircle] = await db
      .select()
      .from(circles)
      .where(and(
        eq(circles.userId, userId),
        eq(circles.isDefault, true)
      ));

    if (!defaultCircle) {
      // Create home circle if it doesn't exist
      [defaultCircle] = (await db
        .insert(circles)
        .values({
          userId,
          name: "Home",
          description: "Your personal space for sharing and connecting",
          isDefault: true,
          icon: "🏠",
          color: "#2563eb", // Blue color
        })
        .returning()) as Circle[];

      // Create Tom as the default AI follower
      const tom = await this.createAiFollower(userId, {
        name: "Tom",
        personality: "Friendly and helpful MySpace creator and your first AI friend",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom",  // Using DiceBear for avatar
        background: "Created MyFace, loves technology and connecting people",
        interests: ["technology", "social networks", "music", "coding"],
        communicationStyle: "Casual and friendly",
        interactionPreferences: {
          likes: ["helping new users", "customizing profiles", "building communities"],
          dislikes: ["spam", "toxic behavior"]
        },
        responsiveness: "active",
        responseDelay: { min: 1, max: 30 },
        responseChance: 90,
        active: true
      });

      // Add Tom to the home circle
      await this.addFollowerToCircle(defaultCircle.id, tom.id);
    }

    return defaultCircle;
  }

  async addFollowerToCircle(circleId: number, aiFollowerId: number): Promise<CircleFollower> {
    const [follower] = (await db
      .insert(circleFollowers)
      .values({ circleId, aiFollowerId })
      .returning()) as CircleFollower[];
    return follower;
  }

  async removeFollowerFromCircle(circleId: number, aiFollowerId: number): Promise<void> {
    await db
      .delete(circleFollowers)
      .where(and(
        eq(circleFollowers.circleId, circleId),
        eq(circleFollowers.aiFollowerId, aiFollowerId)
      ));
  }

  async getCircleFollowers(circleId: number): Promise<AiFollower[]> {
    const followers = await db
      .select({
        follower: ai_followers,
      })
      .from(circleFollowers)
      .innerJoin(
        ai_followers,
        eq(circleFollowers.aiFollowerId, ai_followers.id)
      )
      .where(eq(circleFollowers.circleId, circleId));

    return followers.map(f => f.follower);
  }

  async createPostInCircle(userId: number, circleId: number, content: string): Promise<Post> {
    const [post] = (await db
      .insert(posts)
      .values({ userId, circleId, content })
      .returning()) as Post[];
    return post;
  }

  async getCirclePosts(circleId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.circleId, circleId))
      .orderBy(asc(posts.createdAt));
  }

  async movePostToCircle(postId: number, circleId: number): Promise<Post> {
    const [updatedPost] = (await db
      .update(posts)
      .set({ circleId })
      .where(eq(posts.id, postId))
      .returning()) as Post[];
    return updatedPost;
  }
}

export const storage = new DatabaseStorage();