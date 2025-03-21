import { 
  InsertUser, User, Post, AiFollower, AiInteraction, PendingResponse,
  Circle, InsertCircle, CircleFollower, InsertCircleFollower,
  InsertCircleMember, CircleMember, InsertCircleInvitation, CircleInvitation,
  Notification, InsertNotification, DirectChat, InsertDirectChat,
  // Add table imports
  users, posts, ai_followers, aiInteractions, pendingResponses,
  circles, circleFollowers, circleMembers, circleInvitations,
  notifications, directChats
} from "@shared/schema";
import { eq, and, asc, or, desc } from "drizzle-orm";
import { db } from "./db";
import { defaultTomConfig } from "./config/default-ai-follower";
import { sql } from 'drizzle-orm/sql';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<Pick<User, "avatarUrl" | "bio">>): Promise<User>;
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
  updateAiFollower(id: number, updates: Partial<Pick<AiFollower, "name" | "personality" | "responsiveness" | "background" | "communicationStyle" | "tools">>): Promise<AiFollower>;
  updateFollowerInterests(id: number, interests: string[]): Promise<void>;
  updateFollowerInteractionPreferences(id: number, likes: string[], dislikes: string[]): Promise<void>;
  deleteAiFollower(id: number): Promise<void>;
  deactivateAiFollower(id: number): Promise<AiFollower>;
  reactivateAiFollower(id: number): Promise<AiFollower>;
  getPostPendingResponses(postId: number): Promise<PendingResponse[]>;

  createCircle(userId: number, circle: InsertCircle): Promise<Circle>;
  getCircle(id: number): Promise<Circle | undefined>;
  getUserCircles(userId: number): Promise<{
    owned: Circle[];
    shared: Circle[];
    invited: Circle[];
  }>;
  updateCircle(id: number, updates: Partial<InsertCircle>): Promise<Circle>;
  deleteCircle(id: number): Promise<void>;
  getDefaultCircle(userId: number): Promise<Circle>;
  setDefaultCircle(userId: number, circleId: number): Promise<Circle>;
  addFollowerToCircle(circleId: number, aiFollowerId: number): Promise<CircleFollower>;
  removeFollowerFromCircle(circleId: number, aiFollowerId: number): Promise<void>;
  getCircleFollowers(circleId: number): Promise<(AiFollower & { muted?: boolean })[]>;
  toggleFollowerMuteInCircle(circleId: number, aiFollowerId: number, muted?: boolean): Promise<CircleFollower>;
  createPostInCircle(userId: number, circleId: number, content: string): Promise<Post>;
  getCirclePosts(circleId: number): Promise<Post[]>;
  movePostToCircle(postId: number, circleId: number): Promise<Post>;

  addCircleMember(member: InsertCircleMember): Promise<CircleMember>;
  removeCircleMember(circleId: number, userId: number): Promise<void>;
  getCircleMembers(circleId: number, status: "active" | "deactivated" | "all"): Promise<CircleMember[]>;
  createCircleInvitation(invitation: Omit<InsertCircleInvitation, "status">): Promise<CircleInvitation>;
  getCircleInvitation(id: number): Promise<CircleInvitation | undefined>;
  getCircleInvitations(circleId: number): Promise<CircleInvitation[]>;
  getUserPendingInvitations(userId: number): Promise<CircleInvitation[]>;
  updateInvitationStatus(id: number, status: "accepted" | "declined"): Promise<CircleInvitation>;
  getCircleWithDetails(id: number): Promise<{
    circle: Circle;
    owner: User;
    members: (CircleMember & { username: string })[];
    followers: (AiFollower & { muted?: boolean })[];
  } | undefined>;
  deactivateCircleMember(circleId: number, userId: number): Promise<void>;
  reactivateCircleMember(circleId: number, userId: number): Promise<void>;
  getDeactivatedCircles(userId: number): Promise<Circle[]>;

  // Add notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  
  // Direct chat methods
  createDirectChatMessage(message: Omit<InsertDirectChat, "createdAt">): Promise<DirectChat>;
  getDirectChatHistory(userId: number, aiFollowerId: number, limit?: number): Promise<DirectChat[]>;
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
  
  async updateUser(id: number, updates: Partial<Pick<User, "avatarUrl" | "bio">>): Promise<User> {
    try {
      console.log("[Storage] Updating user:", id, "with:", updates);
      const [updatedUser] = (await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning()) as User[];

      console.log("[Storage] Updated user successfully");
      return updatedUser;
    } catch (error) {
      console.error("[Storage] Error updating user:", error);
      throw error;
    }
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
      scheduledFor: response.scheduledFor,
      hasMetadata: !!response.metadata
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
    updates: Partial<Pick<AiFollower, "name" | "personality" | "responsiveness" | "background" | "communicationStyle" | "tools">>
  ): Promise<AiFollower> {
    try {
      console.log("[Storage] Updating AI follower:", id, "with:", updates);
      const [updatedFollower] = (await db
        .update(ai_followers)
        .set(updates)
        .where(eq(ai_followers.id, id))
        .returning()) as AiFollower[];

      console.log("[Storage] Updated AI follower successfully");
      return updatedFollower;
    } catch (error) {
      console.error("[Storage] Error updating AI follower:", error);
      throw error;
    }
  }
  
  async updateFollowerInterests(id: number, interests: string[]): Promise<void> {
    try {
      console.log("[Storage] Updating AI follower interests:", id, "with:", interests);
      await db
        .update(ai_followers)
        .set({ interests })
        .where(eq(ai_followers.id, id));
      console.log("[Storage] Updated AI follower interests successfully");
    } catch (error) {
      console.error("[Storage] Error updating AI follower interests:", error);
      throw error;
    }
  }
  
  async updateFollowerInteractionPreferences(id: number, likes: string[], dislikes: string[]): Promise<void> {
    try {
      console.log("[Storage] Updating AI follower interaction preferences:", id);
      console.log("[Storage] Likes:", likes);
      console.log("[Storage] Dislikes:", dislikes);
      
      // Create the preferences object
      const interactionPreferences = {
        likes,
        dislikes
      };
      
      await db
        .update(ai_followers)
        .set({ interactionPreferences })
        .where(eq(ai_followers.id, id));
        
      console.log("[Storage] Updated AI follower interaction preferences successfully");
    } catch (error) {
      console.error("[Storage] Error updating AI follower interaction preferences:", error);
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

  async getUserCircles(userId: number): Promise<{
    owned: Circle[];
    shared: Circle[];
    invited: Circle[];
  }> {
    const [owned, memberOf, invitedTo] = await Promise.all([
      // Get circles owned by the user
      db.select()
        .from(circles)
        .where(eq(circles.userId, userId))
        .orderBy(asc(circles.createdAt)),

      // Get circles where user is a member
      db.select({
        circle: circles,
      })
        .from(circleMembers)
        .innerJoin(circles, eq(circleMembers.circleId, circles.id))
        .where(eq(circleMembers.userId, userId))
        .orderBy(asc(circles.createdAt)),

      // Get circles user is invited to
      db.select({
        circle: circles,
      })
        .from(circleInvitations)
        .innerJoin(circles, eq(circleInvitations.circleId, circles.id))
        .where(
          and(
            eq(circleInvitations.inviteeId, userId),
            eq(circleInvitations.status, "pending")
          )
        )
        .orderBy(asc(circles.createdAt)),
    ]);

    return {
      owned,
      shared: memberOf.map(m => m.circle),
      invited: invitedTo.map(i => i.circle),
    };
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
    console.log("[Storage] Getting default circle for user:", userId);

    let [defaultCircle] = await db
      .select()
      .from(circles)
      .where(and(
        eq(circles.userId, userId),
        eq(circles.isDefault, true)
      ));

    if (!defaultCircle) {
      console.log("[Storage] Creating new Home circle for user:", userId);

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

      console.log("[Storage] Created Home circle:", defaultCircle);

      // Create Tom as the default AI follower using the default config
      const tom = await this.createAiFollower(userId, defaultTomConfig);

      console.log("[Storage] Created Tom follower:", tom);

      // Add Tom to the home circle
      await this.addFollowerToCircle(defaultCircle.id, tom.id);
      console.log("[Storage] Added Tom to Home circle");
    }

    return defaultCircle;
  }
  
  async setDefaultCircle(userId: number, circleId: number): Promise<Circle> {
    console.log("[Storage] Setting default circle for user:", userId, "circle:", circleId);
    
    // First, unset any existing default circle for this user
    await db
      .update(circles)
      .set({ isDefault: false })
      .where(and(
        eq(circles.userId, userId),
        eq(circles.isDefault, true)
      ));
    
    // Then set the new default circle
    const [updatedCircle] = (await db
      .update(circles)
      .set({ isDefault: true })
      .where(and(
        eq(circles.id, circleId),
        eq(circles.userId, userId)
      ))
      .returning()) as Circle[];
    
    console.log("[Storage] Successfully set default circle:", updatedCircle);
    return updatedCircle;
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

  async toggleFollowerMuteInCircle(circleId: number, aiFollowerId: number, muted?: boolean): Promise<CircleFollower> {
    console.log("[Storage] Toggling follower mute status in circle:", circleId, "for follower:", aiFollowerId);
    
    // First get the current state
    const [circleFollower] = await db
      .select()
      .from(circleFollowers)
      .where(
        and(
          eq(circleFollowers.circleId, circleId),
          eq(circleFollowers.aiFollowerId, aiFollowerId)
        )
      );
    
    if (!circleFollower) {
      throw new Error(`Circle follower relationship not found for circle ${circleId} and follower ${aiFollowerId}`);
    }
    
    // If muted param is provided, use it, otherwise toggle the current value
    const newMutedValue = muted !== undefined ? muted : !circleFollower.muted;
    
    console.log("[Storage] Setting muted status to:", newMutedValue);
    
    // Update the muted status
    const [updatedFollower] = await db
      .update(circleFollowers)
      .set({ muted: newMutedValue })
      .where(
        and(
          eq(circleFollowers.circleId, circleId),
          eq(circleFollowers.aiFollowerId, aiFollowerId)
        )
      )
      .returning();
    
    console.log("[Storage] Successfully updated follower mute status");
    return updatedFollower;
  }

  async getCircleFollowers(circleId: number): Promise<(AiFollower & { muted?: boolean })[]> {
    const followers = await db
      .select({
        follower: ai_followers,
        muted: circleFollowers.muted,
      })
      .from(circleFollowers)
      .innerJoin(
        ai_followers,
        eq(circleFollowers.aiFollowerId, ai_followers.id)
      )
      .where(eq(circleFollowers.circleId, circleId));

    return followers.map(f => ({
      ...f.follower,
      muted: f.muted,
    }));
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

  async addCircleMember(member: InsertCircleMember): Promise<CircleMember> {
    const [circleMember] = (await db
      .insert(circleMembers)
      .values({
        ...member,
        status: member.status || "active"
      })
      .returning()) as CircleMember[];
    return circleMember;
  }

  async removeCircleMember(circleId: number, userId: number): Promise<void> {
    await db
      .delete(circleMembers)
      .where(and(
        eq(circleMembers.circleId, circleId),
        eq(circleMembers.userId, userId)
      ));
  }

  async getCircleMembers(
    circleId: number,
    status: "active" | "deactivated" | "all" = "active"
  ): Promise<CircleMember[]> {
    const query = db
      .select()
      .from(circleMembers)
      .where(eq(circleMembers.circleId, circleId));

    if (status !== "all") {
      query.where(eq(circleMembers.status, status));
    }

    return await query.orderBy(asc(circleMembers.joinedAt));
  }

  async createCircleInvitation(
    invitation: Omit<InsertCircleInvitation, "status">
  ): Promise<CircleInvitation> {
    const [circleInvitation] = (await db
      .insert(circleInvitations)
      .values({
        ...invitation,
        status: "pending" as const
      })
      .returning()) as CircleInvitation[];
    return circleInvitation;
  }

  async getCircleInvitation(id: number): Promise<CircleInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(circleInvitations)
      .where(eq(circleInvitations.id, id));
    return invitation;
  }

  async getCircleInvitations(circleId: number): Promise<CircleInvitation[]> {
    return await db
      .select()
      .from(circleInvitations)
      .where(eq(circleInvitations.circleId, circleId))
      .orderBy(asc(circleInvitations.createdAt));
  }

  async getUserPendingInvitations(userId: number): Promise<CircleInvitation[]> {
    return await db
      .select()
      .from(circleInvitations)
      .where(and(
        eq(circleInvitations.inviteeId, userId),
        eq(circleInvitations.status, "pending")
      ))
      .orderBy(asc(circleInvitations.createdAt));
  }

  async updateInvitationStatus(
    id: number,
    status: "accepted" | "declined"
  ): Promise<CircleInvitation> {
    const [invitation] = (await db
      .update(circleInvitations)
      .set({
        status,
        respondedAt: new Date()
      })
      .where(eq(circleInvitations.id, id))
      .returning()) as CircleInvitation[];

    // If invitation is accepted, create a circle member
    if (status === "accepted") {
      await this.addCircleMember({
        circleId: invitation.circleId,
        userId: invitation.inviteeId,
        role: invitation.role,
      });
    }

    return invitation;
  }

  async getCircleWithDetails(id: number): Promise<{
    circle: Circle;
    owner: User;
    members: (CircleMember & { username: string })[];
    followers: (AiFollower & { muted?: boolean })[];
  } | undefined> {
    const circle = await this.getCircle(id);
    if (!circle) return undefined;

    const [owner, followers] = await Promise.all([
      this.getUser(circle.userId),
      this.getCircleFollowers(id),
    ]);

    if (!owner) return undefined;

    // Get members with their usernames by joining with users table
    const members = await db
      .select({
        id: circleMembers.id,
        circleId: circleMembers.circleId,
        userId: circleMembers.userId,
        role: circleMembers.role,
        joinedAt: circleMembers.joinedAt,
        username: users.username,
      })
      .from(circleMembers)
      .innerJoin(users, eq(circleMembers.userId, users.id))
      .where(eq(circleMembers.circleId, id))
      .orderBy(asc(circleMembers.joinedAt));

    // Add owner to members list if not already present
    const ownerMember = members.find(m => m.userId === owner.id);
    if (!ownerMember) {
      members.unshift({
        id: 0, // Temporary ID for display purposes
        circleId: id,
        userId: owner.id,
        role: "owner" as const,
        joinedAt: circle.createdAt,
        username: owner.username,
      });
    }

    return {
      circle,
      owner,
      members,
      followers,
    };
  }

  async deactivateCircleMember(circleId: number, userId: number): Promise<void> {
    await db
      .update(circleMembers)
      .set({ status: "deactivated" })
      .where(
        and(
          eq(circleMembers.circleId, circleId),
          eq(circleMembers.userId, userId)
        )
      );
  }

  async reactivateCircleMember(circleId: number, userId: number): Promise<void> {
    await db
      .update(circleMembers)
      .set({ status: "active" })
      .where(
        and(
          eq(circleMembers.circleId, circleId),
          eq(circleMembers.userId, userId)
        )
      );
  }

  async getDeactivatedCircles(userId: number): Promise<Circle[]> {
    const deactivatedMemberships = await db
      .select({
        circle: circles,
      })
      .from(circleMembers)
      .innerJoin(circles, eq(circleMembers.circleId, circles.id))
      .where(
        and(
          eq(circleMembers.userId, userId),
          eq(circleMembers.status, "deactivated")
        )
      );

    return deactivatedMemberships.map(m => m.circle);
  }

  // Implement notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = (await db
      .insert(notifications)
      .values(notification)
      .returning()) as Notification[];
    return newNotification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
    return Number(result[0].count) || 0;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
  }

  // Direct chat methods
  async createDirectChatMessage(message: Omit<InsertDirectChat, "createdAt">): Promise<DirectChat> {
    try {
      console.log("[Storage] Creating direct chat message:", {
        userId: message.userId,
        aiFollowerId: message.aiFollowerId,
        isUserMessage: message.isUserMessage,
        hasToolsUsed: !!message.toolsUsed
      });

      const [chatMessage] = (await db
        .insert(directChats)
        .values(message)
        .returning()) as DirectChat[];

      console.log("[Storage] Created direct chat message:", {
        id: chatMessage.id,
        isUserMessage: chatMessage.isUserMessage
      });

      return chatMessage;
    } catch (error) {
      console.error("[Storage] Error creating direct chat message:", error);
      throw error;
    }
  }

  async getDirectChatHistory(userId: number, aiFollowerId: number, limit: number = 50): Promise<DirectChat[]> {
    try {
      console.log("[Storage] Getting direct chat history for user:", userId, "with AI follower:", aiFollowerId);
      
      const chatHistory = await db
        .select()
        .from(directChats)
        .where(and(
          eq(directChats.userId, userId),
          eq(directChats.aiFollowerId, aiFollowerId)
        ))
        .orderBy(desc(directChats.createdAt))
        .limit(limit);
      
      // Return in chronological order (oldest first)
      return chatHistory.reverse();
    } catch (error) {
      console.error("[Storage] Error getting direct chat history:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();