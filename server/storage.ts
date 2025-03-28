import { 
  InsertUser, User, Post, AiFollower, AiInteraction, PendingResponse,
  Circle, InsertCircle, CircleFollower, InsertCircleFollower,
  InsertCircleMember, CircleMember, InsertCircleInvitation, CircleInvitation,
  Notification, InsertNotification, DirectChat, InsertDirectChat,
  AiFollowerCollective, InsertAiFollowerCollective, 
  AiFollowerCollectiveMember, InsertAiFollowerCollectiveMember,
  Lab, InsertLab, LabCircle, InsertLabCircle, LabCollective, InsertLabCollective,
  // Add table imports
  users, posts, ai_followers, aiInteractions, pendingResponses,
  circles, circleFollowers, circleMembers, circleInvitations,
  notifications, directChats, aiFollowerCollectives, aiFollowerCollectiveMembers,
  labs, labCircles, labCollectives
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
  getAiFollowers(userId: number): Promise<(AiFollower & { parentName?: string })[]>;
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
  
  // AI Follower Collective methods
  createAiFollowerCollective(userId: number, collective: InsertAiFollowerCollective): Promise<AiFollowerCollective>;
  getAiFollowerCollective(id: number): Promise<AiFollowerCollective | undefined>;
  getUserAiFollowerCollectives(userId: number): Promise<AiFollowerCollective[]>;
  addFollowerToCollective(collectiveId: number, aiFollowerId: number): Promise<AiFollowerCollectiveMember>;
  getCollectiveMembers(collectiveId: number): Promise<(AiFollower & { collectiveMemberId: number })[]>;
  removeFollowerFromCollective(collectiveId: number, aiFollowerId: number): Promise<void>;
  getFollowerCollectives(aiFollowerId: number): Promise<AiFollowerCollective[]>;

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
  
  // Lab methods
  createLab(userId: number, lab: InsertLab): Promise<Lab>;
  getLab(id: number): Promise<Lab | undefined>;
  getUserLabs(userId: number): Promise<Lab[]>;
  updateLab(id: number, updates: Partial<Lab>): Promise<Lab>;
  deleteLab(id: number): Promise<void>;
  duplicateLab(id: number, newName?: string): Promise<Lab>;
  updateLabStatus(id: number, status: "draft" | "active" | "completed" | "archived"): Promise<Lab>;
  
  // Lab-Circle methods
  addCircleToLab(labId: number, circleId: number, role?: "control" | "treatment" | "observation"): Promise<LabCircle>;
  getLabCircles(labId: number): Promise<(Circle & { role: "control" | "treatment" | "observation" })[]>;
  removeCircleFromLab(labId: number, circleId: number): Promise<void>;
  updateLabCircleRole(labId: number, circleId: number, role: "control" | "treatment" | "observation"): Promise<LabCircle>;
  
  // Lab-Collective methods
  addCollectiveToLab(labId: number, collectiveId: number, role?: "control" | "treatment" | "observation", behaviorConfig?: any): Promise<LabCollective>;
  getLabCollectives(labId: number): Promise<(AiFollowerCollective & { role: "control" | "treatment" | "observation", behaviorConfig?: any })[]>;
  removeCollectiveFromLab(labId: number, collectiveId: number): Promise<void>;
  updateLabCollectiveRole(labId: number, collectiveId: number, role: "control" | "treatment" | "observation"): Promise<LabCollective>;
  updateLabCollectiveBehavior(labId: number, collectiveId: number, behaviorConfig: any): Promise<LabCollective>;
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

  async getAiFollowers(userId: number): Promise<(AiFollower & { parentName?: string })[]> {
    // First get all followers
    const followers = await db
      .select()
      .from(ai_followers)
      .where(eq(ai_followers.userId, userId));
    
    // For followers with parentId, look up their parent names
    const followersWithParentInfo = await Promise.all(
      followers.map(async (follower) => {
        if (follower.parentId) {
          const [parent] = await db
            .select({ name: ai_followers.name })
            .from(ai_followers)
            .where(eq(ai_followers.id, follower.parentId));
          
          return {
            ...follower,
            parentName: parent?.name
          };
        }
        return follower;
      })
    );
    
    return followersWithParentInfo;
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

  // AI Follower Collective methods
  async createAiFollowerCollective(userId: number, collective: InsertAiFollowerCollective): Promise<AiFollowerCollective> {
    try {
      console.log("[Storage] Creating AI follower collective:", {
        userId,
        name: collective.name,
        personality: collective.personality
      });
      
      const [newCollective] = (await db
        .insert(aiFollowerCollectives)
        .values({ ...collective, userId })
        .returning()) as AiFollowerCollective[];
      
      console.log("[Storage] Created AI follower collective:", {
        id: newCollective.id,
        name: newCollective.name
      });
      
      return newCollective;
    } catch (error) {
      console.error("[Storage] Error creating AI follower collective:", error);
      throw error;
    }
  }
  
  async getAiFollowerCollective(id: number): Promise<AiFollowerCollective | undefined> {
    try {
      console.log("[Storage] Getting AI follower collective by ID:", id);
      
      const [collective] = await db
        .select()
        .from(aiFollowerCollectives)
        .where(eq(aiFollowerCollectives.id, id));
      
      if (collective) {
        console.log("[Storage] Retrieved AI follower collective:", {
          id: collective.id,
          name: collective.name,
          userId: collective.userId
        });
      } else {
        console.log("[Storage] AI follower collective not found");
      }
      
      return collective;
    } catch (error) {
      console.error("[Storage] Error getting AI follower collective:", error);
      throw error;
    }
  }
  
  async getUserAiFollowerCollectives(userId: number): Promise<AiFollowerCollective[]> {
    try {
      console.log("[Storage] Getting AI follower collectives for user:", userId);
      
      const collectives = await db
        .select()
        .from(aiFollowerCollectives)
        .where(eq(aiFollowerCollectives.userId, userId))
        .orderBy(aiFollowerCollectives.createdAt);
      
      console.log("[Storage] Retrieved AI follower collectives count:", collectives.length);
      
      return collectives;
    } catch (error) {
      console.error("[Storage] Error getting user AI follower collectives:", error);
      throw error;
    }
  }
  
  async addFollowerToCollective(collectiveId: number, aiFollowerId: number): Promise<AiFollowerCollectiveMember> {
    try {
      console.log("[Storage] Adding AI follower to collective:", {
        collectiveId,
        aiFollowerId
      });
      
      const [membership] = (await db
        .insert(aiFollowerCollectiveMembers)
        .values({ collectiveId, aiFollowerId })
        .returning()) as AiFollowerCollectiveMember[];
      
      console.log("[Storage] Added AI follower to collective:", {
        id: membership.id,
        collectiveId: membership.collectiveId,
        aiFollowerId: membership.aiFollowerId
      });
      
      return membership;
    } catch (error) {
      console.error("[Storage] Error adding AI follower to collective:", error);
      throw error;
    }
  }
  
  async getCollectiveMembers(collectiveId: number): Promise<(AiFollower & { collectiveMemberId: number })[]> {
    try {
      console.log("[Storage] Getting collective members for collective:", collectiveId);
      
      const members = await db
        .select({
          ...ai_followers,
          collectiveMemberId: aiFollowerCollectiveMembers.id
        })
        .from(aiFollowerCollectiveMembers)
        .innerJoin(
          ai_followers,
          eq(aiFollowerCollectiveMembers.aiFollowerId, ai_followers.id)
        )
        .where(eq(aiFollowerCollectiveMembers.collectiveId, collectiveId));
      
      console.log("[Storage] Retrieved collective members count:", members.length);
      
      return members as (AiFollower & { collectiveMemberId: number })[];
    } catch (error) {
      console.error("[Storage] Error getting collective members:", error);
      throw error;
    }
  }
  
  async removeFollowerFromCollective(collectiveId: number, aiFollowerId: number): Promise<void> {
    try {
      console.log("[Storage] Removing AI follower from collective:", {
        collectiveId,
        aiFollowerId
      });
      
      await db
        .delete(aiFollowerCollectiveMembers)
        .where(
          and(
            eq(aiFollowerCollectiveMembers.collectiveId, collectiveId),
            eq(aiFollowerCollectiveMembers.aiFollowerId, aiFollowerId)
          )
        );
      
      console.log("[Storage] Removed AI follower from collective");
    } catch (error) {
      console.error("[Storage] Error removing AI follower from collective:", error);
      throw error;
    }
  }
  
  async getFollowerCollectives(aiFollowerId: number): Promise<AiFollowerCollective[]> {
    try {
      console.log("[Storage] Getting collectives for AI follower:", aiFollowerId);
      
      const collectives = await db
        .select({
          ...aiFollowerCollectives
        })
        .from(aiFollowerCollectiveMembers)
        .innerJoin(
          aiFollowerCollectives,
          eq(aiFollowerCollectiveMembers.collectiveId, aiFollowerCollectives.id)
        )
        .where(eq(aiFollowerCollectiveMembers.aiFollowerId, aiFollowerId));
      
      console.log("[Storage] Retrieved collectives count for follower:", collectives.length);
      
      return collectives as AiFollowerCollective[];
    } catch (error) {
      console.error("[Storage] Error getting follower collectives:", error);
      throw error;
    }
  }

  // Lab Management Methods
  async createLab(userId: number, lab: InsertLab): Promise<Lab> {
    try {
      console.log("[Storage] Creating lab:", {
        userId,
        name: lab.name,
        experimentType: lab.experimentType
      });
      
      const [newLab] = (await db
        .insert(labs)
        .values({ 
          ...lab, 
          userId,
          updatedAt: new Date() 
        })
        .returning()) as Lab[];
      
      console.log("[Storage] Created lab:", {
        id: newLab.id,
        name: newLab.name
      });
      
      return newLab;
    } catch (error) {
      console.error("[Storage] Error creating lab:", error);
      throw error;
    }
  }
  
  async getLab(id: number): Promise<Lab | undefined> {
    try {
      console.log("[Storage] Getting lab by ID:", id);
      
      const [lab] = await db
        .select()
        .from(labs)
        .where(eq(labs.id, id));
      
      if (lab) {
        console.log("[Storage] Retrieved lab:", {
          id: lab.id,
          name: lab.name,
          status: lab.status
        });
      } else {
        console.log("[Storage] Lab not found");
      }
      
      return lab;
    } catch (error) {
      console.error("[Storage] Error getting lab:", error);
      throw error;
    }
  }
  
  async getUserLabs(userId: number): Promise<Lab[]> {
    try {
      console.log("[Storage] Getting labs for user:", userId);
      
      const userLabs = await db
        .select()
        .from(labs)
        .where(eq(labs.userId, userId))
        .orderBy(desc(labs.updatedAt));
      
      console.log("[Storage] Retrieved labs count:", userLabs.length);
      
      return userLabs;
    } catch (error) {
      console.error("[Storage] Error getting user labs:", error);
      throw error;
    }
  }
  
  async updateLab(id: number, updates: Partial<Lab>): Promise<Lab> {
    try {
      console.log("[Storage] Updating lab:", id, "with:", updates);
      
      // Always update the updatedAt timestamp
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date()
      };
      
      const [updatedLab] = (await db
        .update(labs)
        .set(updatesWithTimestamp)
        .where(eq(labs.id, id))
        .returning()) as Lab[];
      
      console.log("[Storage] Updated lab successfully:", {
        id: updatedLab.id,
        name: updatedLab.name
      });
      
      return updatedLab;
    } catch (error) {
      console.error("[Storage] Error updating lab:", error);
      throw error;
    }
  }
  
  async deleteLab(id: number): Promise<void> {
    try {
      console.log("[Storage] Deleting lab:", id);
      
      // First delete all circle associations
      await db
        .delete(labCircles)
        .where(eq(labCircles.labId, id));
      
      console.log("[Storage] Deleted lab circles associations");
      
      // Then delete the lab itself
      await db
        .delete(labs)
        .where(eq(labs.id, id));
      
      console.log("[Storage] Successfully deleted lab");
    } catch (error) {
      console.error("[Storage] Error deleting lab:", error);
      throw error;
    }
  }
  
  async duplicateLab(id: number, newName?: string): Promise<Lab> {
    try {
      console.log("[Storage] Duplicating lab:", id);
      
      // First get the original lab
      const originalLab = await this.getLab(id);
      
      if (!originalLab) {
        throw new Error(`Lab with id ${id} not found`);
      }
      
      // Create a new lab with the same properties
      const labCopy: InsertLab = {
        name: newName || `${originalLab.name} (Copy)`,
        description: originalLab.description,
        experimentType: originalLab.experimentType,
        goals: originalLab.goals,
        successMetrics: originalLab.successMetrics
      };
      
      // Create the new lab
      const newLab = await this.createLab(originalLab.userId, labCopy);
      
      console.log("[Storage] Created duplicate lab:", {
        originalId: id,
        newId: newLab.id,
        name: newLab.name
      });
      
      // Get all circles associated with the original lab
      const originalCircles = await this.getLabCircles(id);
      
      // Associate the same circles with the new lab
      for (const circle of originalCircles) {
        await this.addCircleToLab(newLab.id, circle.id, circle.role as "control" | "treatment" | "observation");
      }
      
      console.log("[Storage] Copied circle associations to new lab");
      
      return newLab;
    } catch (error) {
      console.error("[Storage] Error duplicating lab:", error);
      throw error;
    }
  }
  
  async updateLabStatus(id: number, status: "draft" | "active" | "completed" | "archived"): Promise<Lab> {
    try {
      console.log("[Storage] Updating lab status:", id, "to", status);
      
      return await this.updateLab(id, { status });
    } catch (error) {
      console.error("[Storage] Error updating lab status:", error);
      throw error;
    }
  }
  
  // Lab-Circle Methods
  async addCircleToLab(labId: number, circleId: number, role: "control" | "treatment" | "observation" = "treatment"): Promise<LabCircle> {
    try {
      console.log("[Storage] Adding circle to lab:", {
        labId,
        circleId,
        role
      });
      
      // Check if this circle is already added to the lab
      const existingLabCircle = await db
        .select()
        .from(labCircles)
        .where(and(
          eq(labCircles.labId, labId),
          eq(labCircles.circleId, circleId)
        ))
        .then(rows => rows[0] as LabCircle | undefined);
      
      if (existingLabCircle) {
        console.log("[Storage] Circle already exists in lab, updating role:", {
          labId,
          circleId,
          oldRole: existingLabCircle.role,
          newRole: role
        });
        
        // If it exists, update the role if needed
        if (existingLabCircle.role !== role) {
          const [updatedLabCircle] = (await db
            .update(labCircles)
            .set({ role })
            .where(and(
              eq(labCircles.labId, labId),
              eq(labCircles.circleId, circleId)
            ))
            .returning()) as LabCircle[];
            
          // Update the lab's updatedAt timestamp
          await this.updateLab(labId, {});
          
          return updatedLabCircle;
        }
        
        return existingLabCircle;
      }
      
      // Otherwise, insert a new record
      const [labCircle] = (await db
        .insert(labCircles)
        .values({ labId, circleId, role })
        .returning()) as LabCircle[];
      
      // Update the lab's updatedAt timestamp
      await this.updateLab(labId, {});
      
      console.log("[Storage] Added circle to lab:", {
        id: labCircle.id,
        labId: labCircle.labId,
        circleId: labCircle.circleId,
        role: labCircle.role
      });
      
      return labCircle;
    } catch (error) {
      console.error("[Storage] Error adding circle to lab:", error);
      throw error;
    }
  }
  
  async getLabCircles(labId: number): Promise<(Circle & { role: "control" | "treatment" | "observation" })[]> {
    try {
      console.log("[Storage] Getting circles for lab:", labId);
      
      const labCirclesData = await db
        .select({
          ...circles,
          role: labCircles.role
        })
        .from(labCircles)
        .innerJoin(circles, eq(labCircles.circleId, circles.id))
        .where(eq(labCircles.labId, labId));
      
      console.log("[Storage] Retrieved lab circles count:", labCirclesData.length);
      
      return labCirclesData;
    } catch (error) {
      console.error("[Storage] Error getting lab circles:", error);
      throw error;
    }
  }
  
  async removeCircleFromLab(labId: number, circleId: number): Promise<void> {
    try {
      console.log("[Storage] Removing circle from lab:", {
        labId,
        circleId
      });
      
      await db
        .delete(labCircles)
        .where(
          and(
            eq(labCircles.labId, labId),
            eq(labCircles.circleId, circleId)
          )
        );
      
      // Update the lab's updatedAt timestamp
      await this.updateLab(labId, {});
      
      console.log("[Storage] Removed circle from lab successfully");
    } catch (error) {
      console.error("[Storage] Error removing circle from lab:", error);
      throw error;
    }
  }
  
  async updateLabCircleRole(labId: number, circleId: number, role: "control" | "treatment" | "observation"): Promise<LabCircle> {
    try {
      console.log("[Storage] Updating lab circle role:", {
        labId,
        circleId,
        role
      });
      
      const [updatedLabCircle] = (await db
        .update(labCircles)
        .set({ role })
        .where(
          and(
            eq(labCircles.labId, labId),
            eq(labCircles.circleId, circleId)
          )
        )
        .returning()) as LabCircle[];
      
      // Update the lab's updatedAt timestamp
      await this.updateLab(labId, {});
      
      console.log("[Storage] Updated lab circle role successfully");
      
      return updatedLabCircle;
    } catch (error) {
      console.error("[Storage] Error updating lab circle role:", error);
      throw error;
    }
  }

  // Lab-Collective methods
  async addCollectiveToLab(labId: number, collectiveId: number, role: "control" | "treatment" | "observation" = "treatment", behaviorConfig?: any): Promise<LabCollective> {
    try {
      console.log("[Storage] Adding collective to lab:", {
        labId,
        collectiveId,
        role
      });
      
      const [labCollective] = (await db
        .insert(labCollectives)
        .values({
          labId,
          collectiveId,
          role,
          behaviorConfig
        })
        .returning()) as LabCollective[];
      
      // Update the lab's updatedAt timestamp
      await this.updateLab(labId, {});
      
      console.log("[Storage] Added collective to lab:", {
        id: labCollective.id,
        labId: labCollective.labId,
        collectiveId: labCollective.collectiveId,
        role: labCollective.role
      });
      
      return labCollective;
    } catch (error) {
      console.error("[Storage] Error adding collective to lab:", error);
      throw error;
    }
  }
  
  async getLabCollectives(labId: number): Promise<(AiFollowerCollective & { role: "control" | "treatment" | "observation", behaviorConfig?: any })[]> {
    try {
      console.log("[Storage] Getting collectives for lab:", labId);
      
      const collectivesWithRole = await db
        .select({
          ...aiFollowerCollectives,
          role: labCollectives.role,
          behaviorConfig: labCollectives.behaviorConfig
        })
        .from(labCollectives)
        .innerJoin(
          aiFollowerCollectives,
          eq(labCollectives.collectiveId, aiFollowerCollectives.id)
        )
        .where(eq(labCollectives.labId, labId));
      
      console.log("[Storage] Retrieved collectives for lab:", collectivesWithRole.length);
      
      return collectivesWithRole as (AiFollowerCollective & { role: "control" | "treatment" | "observation", behaviorConfig?: any })[];
    } catch (error) {
      console.error("[Storage] Error getting lab collectives:", error);
      throw error;
    }
  }
  
  async removeCollectiveFromLab(labId: number, collectiveId: number): Promise<void> {
    try {
      console.log("[Storage] Removing collective from lab:", {
        labId,
        collectiveId
      });
      
      await db
        .delete(labCollectives)
        .where(
          and(
            eq(labCollectives.labId, labId),
            eq(labCollectives.collectiveId, collectiveId)
          )
        );
      
      // Update the lab's updatedAt timestamp
      await this.updateLab(labId, {});
      
      console.log("[Storage] Removed collective from lab successfully");
    } catch (error) {
      console.error("[Storage] Error removing collective from lab:", error);
      throw error;
    }
  }
  
  async updateLabCollectiveRole(labId: number, collectiveId: number, role: "control" | "treatment" | "observation"): Promise<LabCollective> {
    try {
      console.log("[Storage] Updating lab collective role:", {
        labId,
        collectiveId,
        role
      });
      
      const [updatedLabCollective] = (await db
        .update(labCollectives)
        .set({ role })
        .where(
          and(
            eq(labCollectives.labId, labId),
            eq(labCollectives.collectiveId, collectiveId)
          )
        )
        .returning()) as LabCollective[];
      
      // Update the lab's updatedAt timestamp
      await this.updateLab(labId, {});
      
      console.log("[Storage] Updated lab collective role successfully");
      
      return updatedLabCollective;
    } catch (error) {
      console.error("[Storage] Error updating lab collective role:", error);
      throw error;
    }
  }
  
  async updateLabCollectiveBehavior(labId: number, collectiveId: number, behaviorConfig: any): Promise<LabCollective> {
    try {
      console.log("[Storage] Updating lab collective behavior:", {
        labId,
        collectiveId
      });
      
      const [updatedLabCollective] = (await db
        .update(labCollectives)
        .set({ behaviorConfig })
        .where(
          and(
            eq(labCollectives.labId, labId),
            eq(labCollectives.collectiveId, collectiveId)
          )
        )
        .returning()) as LabCollective[];
      
      // Update the lab's updatedAt timestamp
      await this.updateLab(labId, {});
      
      console.log("[Storage] Updated lab collective behavior successfully");
      
      return updatedLabCollective;
    } catch (error) {
      console.error("[Storage] Error updating lab collective behavior:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();