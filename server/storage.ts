import { 
  InsertUser, User, Post, AiFollower, AiInteraction, PendingResponse,
  Circle, InsertCircle, CircleFollower, InsertCircleFollower,
  CircleCollective, InsertCircleCollective,
  InsertCircleMember, CircleMember, InsertCircleInvitation, CircleInvitation,
  Notification, InsertNotification, DirectChat, InsertDirectChat,
  AiFollowerCollective, InsertAiFollowerCollective, 
  AiFollowerCollectiveMember, InsertAiFollowerCollectiveMember,
  Lab, InsertLab, LabCircle, InsertLabCircle, LabContent, InsertLabContent, LabAnalysisResult, InsertLabAnalysisResult,
  // Add table imports
  users, posts, ai_followers, aiInteractions, pendingResponses,
  circles, circleFollowers, circleMembers, circleInvitations,
  notifications, directChats, aiFollowerCollectives, aiFollowerCollectiveMembers,
  circleCollectives, labs, labCircles, labContent, labAnalysisResults
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
  getLabPendingResponses(labId: number): Promise<{
    total: number;
    pending: number;
    completed: number;
    completionPercentage: number;
    pendingResponses: (PendingResponse & { aiFollower: AiFollower; post: Post })[];
  }>;
  
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
  
  // Circle Collective methods
  addCollectiveToCircle(circleId: number, collectiveId: number): Promise<CircleCollective>;
  removeCollectiveFromCircle(circleId: number, collectiveId: number): Promise<void>;
  getCircleCollectives(circleId: number): Promise<AiFollowerCollective[]>;
  
  // Aliases for backward compatibility
  addCircleCollective(circleId: number, collectiveId: number): Promise<CircleCollective>;
  removeCircleCollective(circleId: number, collectiveId: number): Promise<void>;
  
  createPostInCircle(
    userId: number, 
    circleId: number, 
    content: string, 
    labId?: number, 
    labExperiment?: boolean, 
    targetRole?: "control" | "treatment" | "observation" | "all"
  ): Promise<Post>;
  getCirclePosts(circleId: number): Promise<Post[]>;
  movePostToCircle(postId: number, circleId: number): Promise<Post>;
  updatePost(postId: number, updates: Partial<Post>): Promise<Post>;

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
    collectives: AiFollowerCollective[];
  } | undefined>;
  deactivateCircleMember(circleId: number, userId: number): Promise<void>;
  reactivateCircleMember(circleId: number, userId: number): Promise<void>;
  getDeactivatedCircles(userId: number): Promise<Circle[]>;

  // Add notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  createLabExperimentNotification(labId: number, postId: number, targetRole: "control" | "treatment" | "observation" | "all"): Promise<void>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  deleteAllNotifications(userId: number): Promise<void>;
  
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
  getLabCircles(labId: number): Promise<(Circle & LabCircle)[]>;
  getLabCirclesWithStats(labId: number): Promise<(Circle & { 
    role: "control" | "treatment" | "observation",
    memberCount: number,
    followerCount: number,
    addedAt: Date
  })[]>;
  getCircleLabs(circleId: number): Promise<(Lab & { role: "control" | "treatment" | "observation" })[]>;
  getLabsForCircle(circleId: number): Promise<Lab[]>; // Alias for getCircleLabs for API compatibility
  removeCircleFromLab(labId: number, circleId: number): Promise<void>;
  updateLabCircleRole(labId: number, circleId: number, role: "control" | "treatment" | "observation"): Promise<LabCircle>;
  
  // Circle Access Control methods
  grantCircleAccessToUser(userId: number, circleId: number, role: "collaborator" | "viewer"): Promise<CircleMember>;
  
  // Lab Content methods
  createLabContent(labId: number, content: InsertLabContent): Promise<LabContent>;
  getLabContent(labId: number): Promise<LabContent[]>;
  updateLabContent(id: number, updates: Partial<LabContent>): Promise<LabContent>;
  deleteLabContent(id: number): Promise<void>;
  publishLabContent(labId: number): Promise<void>; // Convert lab content to posts when lab is activated
  getLabPosts(labId: number, targetRole?: "control" | "treatment" | "observation" | "all"): Promise<Post[]>;
  getCircleRoleInLab(labId: number, circleId: number): Promise<"control" | "treatment" | "observation" | undefined>;
  getLabCirclesByRole(labId: number, role: "control" | "treatment" | "observation"): Promise<Circle[]>;
  
  // Lab Analysis Results methods
  getLabAnalysisResult(labId: number): Promise<LabAnalysisResult | undefined>;
  saveLabAnalysisResult(labId: number, metricResults: any[], recommendation: any): Promise<LabAnalysisResult>;
  deleteLabAnalysisResult(labId: number): Promise<void>;
  
  // Circle Stats methods
  getCirclePostCount(circleId: number): Promise<number>;
  getCircleFollowerCount(circleId: number): Promise<number>;
  getCircleMemberCount(circleId: number): Promise<number>;
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

  async getPendingResponses(postId?: number): Promise<PendingResponse[]> {
    try {
      const query = db
        .select()
        .from(pendingResponses);
      
      // If a postId is provided, filter by it
      if (postId !== undefined) {
        query.where(and(
          eq(pendingResponses.postId, postId),
          eq(pendingResponses.processed, false)
        ));
      } else {
        // Otherwise just get all unprocessed responses
        query.where(eq(pendingResponses.processed, false));
      }
        
      return await query.orderBy(pendingResponses.scheduledFor);
    } catch (error) {
      console.error("[Storage] Error getting pending responses:", error);
      return []; // Return empty array on error to avoid breaking the UI
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

  async getLabPendingResponses(labId: number): Promise<{
    total: number;
    pending: number;
    completed: number;
    completionPercentage: number;
    pendingResponses: (PendingResponse & { aiFollower: AiFollower; post: Post })[];
  }> {
    try {
      console.log(`[Storage] Getting pending responses for lab ${labId}`);
      
      // Get all posts that belong to this lab
      const labPosts = await this.getLabPosts(labId);
      const labPostIds = labPosts.map(post => post.id);
      
      if (labPostIds.length === 0) {
        return {
          total: 0,
          pending: 0,
          completed: 0,
          completionPercentage: 100,
          pendingResponses: []
        };
      }

      // Get all pending responses for lab posts
      const pendingResponsesWithDetails = await db
        .select({
          pendingResponse: pendingResponses,
          aiFollower: ai_followers,
          post: posts
        })
        .from(pendingResponses)
        .innerJoin(ai_followers, eq(pendingResponses.aiFollowerId, ai_followers.id))
        .innerJoin(posts, eq(pendingResponses.postId, posts.id))
        .where(
          and(
            sql`${pendingResponses.postId} IN (${sql.join(labPostIds.map(id => sql`${id}`), sql`, `)})`,
            eq(pendingResponses.processed, false)
          )
        )
        .orderBy(pendingResponses.scheduledFor);

      // Get count of all responses (including processed) for these lab posts
      const totalResponsesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(pendingResponses)
        .where(
          sql`${pendingResponses.postId} IN (${sql.join(labPostIds.map(id => sql`${id}`), sql`, `)})`
        );

      const totalResponses = Number(totalResponsesResult[0].count) || 0;
      const pendingCount = pendingResponsesWithDetails.length;
      const completedCount = totalResponses - pendingCount;
      const completionPercentage = totalResponses > 0 ? Math.round((completedCount / totalResponses) * 100) : 100;

      // Transform the results to match the expected format
      const transformedPendingResponses = pendingResponsesWithDetails.map(row => ({
        ...row.pendingResponse,
        aiFollower: row.aiFollower,
        post: row.post
      }));

      console.log(`[Storage] Lab ${labId} pending responses: ${pendingCount} pending, ${completedCount} completed, ${completionPercentage}% complete`);

      return {
        total: totalResponses,
        pending: pendingCount,
        completed: completedCount,
        completionPercentage,
        pendingResponses: transformedPendingResponses
      };
    } catch (error) {
      console.error("[Storage] Error getting lab pending responses:", error);
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
      
      // Delete any direct chat messages
      await db
        .delete(directChats)
        .where(eq(directChats.aiFollowerId, id));
      
      console.log("[Storage] Deleted direct chat messages");
      
      // Remove follower from any circles
      await db
        .delete(circleFollowers)
        .where(eq(circleFollowers.aiFollowerId, id));
      
      console.log("[Storage] Removed follower from circles");
      
      // Remove follower from any AI follower collectives
      await db
        .delete(aiFollowerCollectiveMembers)
        .where(eq(aiFollowerCollectiveMembers.aiFollowerId, id));
      
      console.log("[Storage] Removed follower from collectives");

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
    if (!id || isNaN(id)) {
      console.log(`[Storage] Invalid circle ID provided: ${id}`);
      return undefined;
    }
    console.log(`[Storage] Getting circle by ID: ${id}`);
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

  // Circle Collective methods implementation
  async addCollectiveToCircle(circleId: number, collectiveId: number): Promise<CircleCollective> {
    try {
      console.log("[Storage] Adding collective to circle:", {
        circleId,
        collectiveId
      });
      
      const [circleCollective] = (await db
        .insert(circleCollectives)
        .values({
          circleId,
          collectiveId
        })
        .returning()) as CircleCollective[];
      
      console.log("[Storage] Added collective to circle:", {
        id: circleCollective.id,
        circleId: circleCollective.circleId,
        collectiveId: circleCollective.collectiveId
      });
      
      return circleCollective;
    } catch (error) {
      console.error("[Storage] Error adding collective to circle:", error);
      throw error;
    }
  }
  
  async removeCollectiveFromCircle(circleId: number, collectiveId: number): Promise<void> {
    try {
      console.log("[Storage] Removing collective from circle:", {
        circleId,
        collectiveId
      });
      
      await db
        .delete(circleCollectives)
        .where(
          and(
            eq(circleCollectives.circleId, circleId),
            eq(circleCollectives.collectiveId, collectiveId)
          )
        );
      
      console.log("[Storage] Removed collective from circle");
    } catch (error) {
      console.error("[Storage] Error removing collective from circle:", error);
      throw error;
    }
  }
  
  async getCircleCollectives(circleId: number): Promise<AiFollowerCollective[]> {
    try {
      console.log("[Storage] Getting collectives for circle:", circleId);
      
      const collectives = await db
        .select({
          ...aiFollowerCollectives
        })
        .from(circleCollectives)
        .innerJoin(
          aiFollowerCollectives,
          eq(circleCollectives.collectiveId, aiFollowerCollectives.id)
        )
        .where(eq(circleCollectives.circleId, circleId));
      
      console.log("[Storage] Retrieved circle collectives count:", collectives.length);
      
      return collectives as AiFollowerCollective[];
    } catch (error) {
      console.error("[Storage] Error getting circle collectives:", error);
      throw error;
    }
  }
  
  /**
   * Add a collective to a circle
   */
  async addCollectiveToCircle(circleId: number, collectiveId: number): Promise<CircleCollective> {
    try {
      console.log("[Storage] Adding collective to circle:", {
        circleId,
        collectiveId
      });
      
      const [relationship] = (await db
        .insert(circleCollectives)
        .values({ circleId, collectiveId })
        .returning()) as CircleCollective[];
      
      console.log("[Storage] Added collective to circle");
      return relationship;
    } catch (error) {
      console.error("[Storage] Error adding collective to circle:", error);
      throw error;
    }
  }
  
  /**
   * Remove a collective from a circle
   */
  async removeCollectiveFromCircle(circleId: number, collectiveId: number): Promise<void> {
    try {
      console.log("[Storage] Removing collective from circle:", {
        circleId,
        collectiveId
      });
      
      await db
        .delete(circleCollectives)
        .where(
          and(
            eq(circleCollectives.circleId, circleId),
            eq(circleCollectives.collectiveId, collectiveId)
          )
        );
      
      console.log("[Storage] Removed collective from circle");
    } catch (error) {
      console.error("[Storage] Error removing collective from circle:", error);
      throw error;
    }
  }
  
  /**
   * Add a collective to a circle (alias for backward compatibility)
   */
  async addCircleCollective(circleId: number, collectiveId: number): Promise<CircleCollective> {
    return this.addCollectiveToCircle(circleId, collectiveId);
  }
  
  /**
   * Remove a collective from a circle (alias for backward compatibility)
   */
  async removeCircleCollective(circleId: number, collectiveId: number): Promise<void> {
    return this.removeCollectiveFromCircle(circleId, collectiveId);
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

  /**
   * Get the specific relationship between a circle and an AI follower
   */
  async getCircleFollowerRelationship(circleId: number, aiFollowerId: number): Promise<CircleFollower | undefined> {
    console.log("[Storage] Getting circle follower relationship:", circleId, aiFollowerId);
    
    const [relationship] = await db
      .select()
      .from(circleFollowers)
      .where(and(
        eq(circleFollowers.circleId, circleId),
        eq(circleFollowers.aiFollowerId, aiFollowerId)
      ));
    
    console.log("[Storage] Circle follower relationship found:", !!relationship);
    return relationship;
  }

  /**
   * Update an existing follower relationship in a circle
   */
  async updateCircleFollowerRelationship(circleId: number, aiFollowerId: number, updates: Partial<CircleFollower>): Promise<CircleFollower> {
    console.log("[Storage] Updating circle follower relationship:", circleId, aiFollowerId, updates);
    
    // Update the relationship
    const [updatedRelationship] = await db
      .update(circleFollowers)
      .set(updates)
      .where(and(
        eq(circleFollowers.circleId, circleId),
        eq(circleFollowers.aiFollowerId, aiFollowerId)
      ))
      .returning();
    
    console.log("[Storage] Successfully updated circle follower relationship");
    return updatedRelationship;
  }

  /**
   * Add a follower to a circle (alias for backward compatibility)
   */
  async addCircleFollower(circleId: number, aiFollowerId: number): Promise<CircleFollower> {
    console.log("[Storage] Adding circle follower:", circleId, aiFollowerId);
    return this.addFollowerToCircle(circleId, aiFollowerId);
  }

  /**
   * Remove a follower from a circle (alias for backward compatibility)
   */
  async removeCircleFollower(circleId: number, aiFollowerId: number): Promise<void> {
    console.log("[Storage] Removing circle follower:", circleId, aiFollowerId);
    return this.removeFollowerFromCircle(circleId, aiFollowerId);
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

  async createPostInCircle(
    userId: number, 
    circleId: number, 
    content: string, 
    labId?: number, 
    labExperiment?: boolean, 
    targetRole?: "control" | "treatment" | "observation" | "all"
  ): Promise<Post> {
    console.log(`[Storage] Creating post in circle ${circleId}${labExperiment ? ` as lab experiment (lab: ${labId}, target: ${targetRole})` : ''}`);
    
    const postData: any = { 
      userId, 
      circleId, 
      content
    };
    
    // Add lab experiment fields if provided
    if (labExperiment && labId) {
      postData.labId = labId;
      postData.labExperiment = true;
      postData.targetRole = targetRole || "all";
    }
    
    const [post] = (await db
      .insert(posts)
      .values(postData)
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
  
  async updatePost(postId: number, updates: Partial<Post>): Promise<Post> {
    console.log(`[Storage] Updating post ${postId} with:`, updates);
    
    const [updatedPost] = (await db
      .update(posts)
      .set(updates)
      .where(eq(posts.id, postId))
      .returning()) as Post[];
      
    console.log(`[Storage] Updated post successfully`);
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
  
  async getCirclePostCount(circleId: number): Promise<number> {
    console.log("[Storage] Getting post count for circle:", circleId);
    
    if (!circleId || isNaN(circleId)) {
      console.log(`[Storage] Invalid circle ID provided for post count: ${circleId}`);
      return 0;
    }
    
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(eq(posts.circleId, circleId));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error("[Storage] Error getting circle post count:", error);
      return 0;
    }
  }
  
  async getCircleFollowerCount(circleId: number): Promise<number> {
    console.log("[Storage] Getting follower count for circle:", circleId);
    
    if (!circleId || isNaN(circleId)) {
      console.log(`[Storage] Invalid circle ID provided for follower count: ${circleId}`);
      return 0;
    }
    
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(circleFollowers)
        .where(eq(circleFollowers.circleId, circleId));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error("[Storage] Error getting circle follower count:", error);
      return 0;
    }
  }
  
  async getCircleMemberCount(circleId: number): Promise<number> {
    console.log("[Storage] Getting member count for circle:", circleId);
    
    if (!circleId || isNaN(circleId)) {
      console.log(`[Storage] Invalid circle ID provided for member count: ${circleId}`);
      return 0;
    }
    
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(circleMembers)
        .where(
          and(
            eq(circleMembers.circleId, circleId),
            eq(circleMembers.status, "active")
          )
        );
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error("[Storage] Error getting circle member count:", error);
      return 0;
    }
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
    collectives: AiFollowerCollective[];
  } | undefined> {
    const circle = await this.getCircle(id);
    if (!circle) return undefined;

    const [owner, followers, collectives] = await Promise.all([
      this.getUser(circle.userId),
      this.getCircleFollowers(id),
      this.getCircleCollectives(id),
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
      collectives,
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

  async createLabExperimentNotification(labId: number, postId: number, targetRole: "control" | "treatment" | "observation" | "all"): Promise<void> {
    try {
      console.log(`[Storage] Creating lab experiment notifications for lab ${labId}, post ${postId}, role ${targetRole}`);
      
      // Get the lab details
      const lab = await this.getLab(labId);
      if (!lab) {
        console.error(`[Storage] Lab ${labId} not found, cannot create notifications`);
        return;
      }
      
      // Get circles with the target role (or all circles if targetRole is "all")
      let targetCircles: Circle[] = [];
      if (targetRole === "all") {
        // Get all circles in this lab
        targetCircles = await this.getLabCircles(labId);
      } else {
        // Get only circles with the specific role
        targetCircles = await this.getLabCirclesByRole(labId, targetRole as "control" | "treatment" | "observation");
      }
      
      if (targetCircles.length === 0) {
        console.log(`[Storage] No target circles found for role ${targetRole}, skipping notifications`);
        return;
      }
      
      console.log(`[Storage] Found ${targetCircles.length} circles for notifications`);
      
      // For each circle, notify all members except the lab owner
      for (const circle of targetCircles) {
        const members = await this.getCircleMembers(circle.id);
        
        for (const member of members) {
          // Don't notify the lab owner (they created the experiment)
          if (member.userId === lab.userId) continue;
          
          // Create notification for this member
          await this.createNotification({
            userId: member.userId,
            type: "lab_experiment",
            content: `New content available in lab experiment "${lab.name}"`,
            metadata: {
              sourceId: postId,
              sourceType: "post",
              actionUrl: `/labs/${labId}/content`,
              labId: labId,
              labName: lab.name,
              circleName: circle.name,
              circleRole: targetRole,
              experimentType: lab.experimentType
            }
          });
          
          console.log(`[Storage] Created lab experiment notification for user ${member.userId}`);
        }
      }
      
      console.log(`[Storage] Successfully created all lab experiment notifications`);
    } catch (error) {
      console.error(`[Storage] Error creating lab experiment notifications:`, error);
    }
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
    console.log("[Storage] Deleting notification:", id);
    
    if (!id || isNaN(id)) {
      console.error(`[Storage] Invalid notification ID: ${id}`);
      throw new Error(`Invalid notification ID: ${id}`);
    }
    
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
  }

  async deleteAllNotifications(userId: number): Promise<void> {
    console.log("[Storage] Deleting all notifications for user:", userId);
    
    if (!userId || isNaN(userId)) {
      console.error(`[Storage] Invalid user ID provided for deleteAllNotifications: ${userId}`);
      throw new Error(`Invalid user ID: ${userId}`);
    }
    
    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));
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
  
  // Added getDirectChatMessages as an alias for getDirectChatHistory to fix the API
  async getDirectChatMessages(userId: number, aiFollowerId: number, limit: number = 50): Promise<DirectChat[]> {
    try {
      console.log("[Storage] Getting direct chat messages for user:", userId, "with AI follower:", aiFollowerId);
      return this.getDirectChatHistory(userId, aiFollowerId, limit);
    } catch (error) {
      console.error("[Storage] Error getting direct chat messages:", error);
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
  
  /**
   * Get AI collective by ID (alias for backward compatibility)
   */
  async getAiCollective(id: number): Promise<AiFollowerCollective | undefined> {
    return this.getAiFollowerCollective(id);
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
  
  /**
   * Create AI collective (alias for backward compatibility)
   */
  async createAiCollective(data: { name: string; description?: string; followerIds?: number[]; createdBy: number }): Promise<AiFollowerCollective> {
    try {
      console.log("[Storage] Creating AI follower collective (alias):", {
        name: data.name,
        userId: data.createdBy
      });
      
      // Create the collective
      const collective = await this.createAiFollowerCollective(data.createdBy, {
        name: data.name,
        description: data.description || null,
        personality: null,
        userId: data.createdBy,
        active: true
      });
      
      // Add followers if provided
      if (data.followerIds && data.followerIds.length > 0) {
        console.log("[Storage] Adding followers to new collective:", data.followerIds);
        for (const followerId of data.followerIds) {
          await this.addFollowerToCollective(collective.id, followerId)
            .catch(err => console.error(`[Storage] Error adding follower ${followerId} to collective:`, err));
        }
      }
      
      return collective;
    } catch (error) {
      console.error("[Storage] Error creating AI collective:", error);
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
      
      // First delete all posts associated with this lab
      await db
        .delete(posts)
        .where(eq(posts.labId, id));
      
      console.log("[Storage] Deleted lab posts");
      
      // Delete lab content
      await db
        .delete(labContent)
        .where(eq(labContent.labId, id));
      
      console.log("[Storage] Deleted lab content");
      
      // Delete lab analysis results
      await db
        .delete(labAnalysisResults)
        .where(eq(labAnalysisResults.labId, id));
      
      console.log("[Storage] Deleted lab analysis results");
      
      // Then delete all circle associations
      await db
        .delete(labCircles)
        .where(eq(labCircles.labId, id));
      
      console.log("[Storage] Deleted lab circles associations");
      
      // Finally delete the lab itself
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
  
  async getLabCircles(labId: number): Promise<(Circle & LabCircle)[]> {
    try {
      console.log("[Storage] Getting circles for lab:", labId);

      const labCirclesData = await db
        .select({
          ...circles,
          role: labCircles.role,
          circleId: labCircles.circleId,
          addedAt: labCircles.addedAt
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
  
  async getLabCirclesWithStats(labId: number): Promise<(Circle & { 
    role: "control" | "treatment" | "observation",
    memberCount: number,
    followerCount: number,
    addedAt: Date,
    circleId: number
  })[]> {
    try {
      console.log("[Storage] Getting circles with stats for lab:", labId);
      
      // First get the basic circle info with roles
      const labCirclesData = await db
        .select({
          ...circles,
          role: labCircles.role,
          addedAt: labCircles.addedAt,
          circleId: labCircles.circleId  // Explicitly include circleId
        })
        .from(labCircles)
        .innerJoin(circles, eq(labCircles.circleId, circles.id))
        .where(eq(labCircles.labId, labId));
      
      // Enhance each circle with member and follower counts
      const enhancedCircles = await Promise.all(
        labCirclesData.map(async (circle) => {
          // Get member count
          const members = await this.getCircleMembers(circle.id);
          const memberCount = members.length;
          
          // Get follower count
          const followers = await this.getCircleFollowers(circle.id);
          const followerCount = followers.length;
          
          return {
            ...circle,
            memberCount,
            followerCount
          };
        })
      );
      
      console.log("[Storage] Retrieved enhanced lab circles:", 
        enhancedCircles.map(c => ({
          id: c.id,
          name: c.name,
          role: c.role,
          circleId: c.circleId,
          memberCount: c.memberCount,
          followerCount: c.followerCount
        }))
      );
      
      return enhancedCircles;
    } catch (error) {
      console.error("[Storage] Error getting lab circles with stats:", error);
      throw error;
    }
  }
  
  async getCircleLabs(circleId: number): Promise<(Lab & { role: "control" | "treatment" | "observation" })[]> {
    try {
      console.log("[Storage] Getting labs for circle:", circleId);
      
      // Get labs where this circle is a member
      const circleLabs = await db
        .select({
          ...labs,
          role: labCircles.role
        })
        .from(labCircles)
        .innerJoin(labs, eq(labCircles.labId, labs.id))
        .where(eq(labCircles.circleId, circleId));
      
      console.log("[Storage] Retrieved labs count:", circleLabs.length);
      
      return circleLabs;
    } catch (error) {
      console.error("[Storage] Error getting circle labs:", error);
      throw error;
    }
  }
  
  async getLabsForCircle(circleId: number): Promise<Lab[]> {
    try {
      console.log("[Storage] Getting labs for circle (alias method):", circleId);
      // This is just an alias for getCircleLabs for API compatibility
      const labsWithRoles = await this.getCircleLabs(circleId);
      return labsWithRoles;
    } catch (error) {
      console.error("[Storage] Error getting labs for circle:", error);
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
  
  async grantCircleAccessToUser(userId: number, circleId: number, role: "collaborator" | "viewer"): Promise<CircleMember> {
    try {
      console.log("[Storage] Granting circle access to user:", {
        userId,
        circleId,
        role
      });
      
      // Check if user already has access to this circle
      const members = await this.getCircleMembers(circleId);
      const existingMember = members.find(m => m.userId === userId);
      
      if (existingMember) {
        console.log("[Storage] User already has access to circle, updating role if needed");
        
        // If role needs to be updated and they're not already an owner
        if (existingMember.role !== role && existingMember.role !== "owner") {
          const [updatedMember] = (await db
            .update(circleMembers)
            .set({ role })
            .where(and(
              eq(circleMembers.circleId, circleId),
              eq(circleMembers.userId, userId)
            ))
            .returning()) as CircleMember[];
            
          console.log("[Storage] Updated member role from", existingMember.role, "to", role);
          return updatedMember;
        }
        
        return existingMember;
      }
      
      // Otherwise add the user as a new member
      const newMember = await this.addCircleMember({
        circleId,
        userId,
        role
      });
      
      console.log("[Storage] Added new circle member with role:", role);
      return newMember;
    } catch (error) {
      console.error("[Storage] Error granting circle access:", error);
      throw error;
    }
  }

  // Lab Content methods
  async getLabPosts(labId: number, targetRole?: "control" | "treatment" | "observation" | "all"): Promise<any[]> {
    console.log(`[Storage] Getting lab posts for lab ${labId}${targetRole ? ` with target role ${targetRole}` : ''}`);
    
    try {
      // Base query to get all lab experiment posts for this lab
      let query = db
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.labId, labId),
            eq(posts.labExperiment, true)
          )
        );
      
      // If a specific target role is provided, filter by it
      if (targetRole && targetRole !== "all") {
        // For non-all targets, we need posts specifically for that role OR for "all" roles
        query = query.where(
          or(
            eq(posts.targetRole, targetRole),
            eq(posts.targetRole, "all")
          )
        );
      }
      
      // Get the posts ordered by creation date (most recent first)
      const labPosts = await query.orderBy(desc(posts.createdAt));
      
      // Enrich the posts with interactions, pending responses, and circle information
      const enrichedPosts = await Promise.all(
        labPosts.map(async (post) => {
          // Get interactions for this post
          const interactions = await this.getPostInteractions(post.id);
          
          // Get pending responses
          const pendingResponses = await this.getPostPendingResponses(post.id);
          
          // Get circle information if available
          let circle = null;
          if (post.circleId) {
            try {
              const circleInfo = await this.getCircle(post.circleId);
              
              // Get the role of this circle in the lab
              const circleRole = await this.getCircleRoleInLab(labId, post.circleId);
              
              if (circleInfo && circleRole) {
                circle = {
                  ...circleInfo,
                  role: circleRole
                };
              } else if (circleInfo) {
                circle = circleInfo;
              }
            } catch (error) {
              console.error(`[Storage] Error getting circle info for post ${post.id}, circle ${post.circleId}:`, error);
            }
          }
          
          return {
            ...post,
            interactions,
            pendingResponses,
            circle
          };
        })
      );
      
      console.log(`[Storage] Retrieved and enriched ${enrichedPosts.length} lab posts`);
      return enrichedPosts;
    } catch (error) {
      console.error("[Storage] Error getting lab posts:", error);
      throw error;
    }
  }
  
  async getCircleRoleInLab(labId: number, circleId: number): Promise<"control" | "treatment" | "observation" | undefined> {
    console.log(`[Storage] Getting circle role for circle ${circleId} in lab ${labId}`);
    
    try {
      const [labCircle] = await db
        .select()
        .from(labCircles)
        .where(
          and(
            eq(labCircles.labId, labId),
            eq(labCircles.circleId, circleId)
          )
        );
      
      if (labCircle) {
        console.log(`[Storage] Circle has role: ${labCircle.role}`);
        return labCircle.role as "control" | "treatment" | "observation";
      }
      
      console.log(`[Storage] Circle is not part of this lab`);
      return undefined;
    } catch (error) {
      console.error("[Storage] Error getting circle role in lab:", error);
      throw error;
    }
  }
  
  async getLabCirclesByRole(labId: number, role: "control" | "treatment" | "observation"): Promise<Circle[]> {
    console.log(`[Storage] Getting lab circles with role ${role} for lab ${labId}`);
    
    try {
      const labCirclesWithRole = await db
        .select({
          circle: circles,
        })
        .from(labCircles)
        .innerJoin(
          circles,
          eq(labCircles.circleId, circles.id)
        )
        .where(
          and(
            eq(labCircles.labId, labId),
            eq(labCircles.role, role)
          )
        );
      
      const result = labCirclesWithRole.map(item => item.circle);
      console.log(`[Storage] Found ${result.length} circles with role ${role}`);
      
      return result;
    } catch (error) {
      console.error(`[Storage] Error getting lab circles with role ${role}:`, error);
      throw error;
    }
  }

  // Lab Analysis Results methods implementation
  async getLabAnalysisResult(labId: number): Promise<LabAnalysisResult | undefined> {
    console.log(`[Storage] Getting lab analysis result for lab ${labId}`);
    
    try {
      const [result] = await db
        .select()
        .from(labAnalysisResults)
        .where(eq(labAnalysisResults.labId, labId));
      
      if (result) {
        console.log(`[Storage] Found analysis result for lab ${labId}`);
      } else {
        console.log(`[Storage] No analysis result found for lab ${labId}`);
      }
      
      return result as LabAnalysisResult | undefined;
    } catch (error) {
      console.error(`[Storage] Error getting lab analysis result:`, error);
      return undefined;
    }
  }
  
  async saveLabAnalysisResult(labId: number, metricResults: any[], recommendation: any): Promise<LabAnalysisResult> {
    console.log(`[Storage] Saving lab analysis result for lab ${labId}`);
    
    try {
      // Check if there's an existing result
      const existingResult = await this.getLabAnalysisResult(labId);
      
      if (existingResult) {
        // Update existing record
        console.log(`[Storage] Updating existing analysis result for lab ${labId}`);
        const [updatedResult] = (await db
          .update(labAnalysisResults)
          .set({
            metricResults,
            recommendation,
            updatedAt: new Date()
          })
          .where(eq(labAnalysisResults.labId, labId))
          .returning()) as LabAnalysisResult[];
        
        return updatedResult;
      } else {
        // Create new record
        console.log(`[Storage] Creating new analysis result for lab ${labId}`);
        const [newResult] = (await db
          .insert(labAnalysisResults)
          .values({
            labId,
            metricResults,
            recommendation
          })
          .returning()) as LabAnalysisResult[];
        
        return newResult;
      }
    } catch (error) {
      console.error(`[Storage] Error saving lab analysis result:`, error);
      throw error;
    }
  }
  
  async deleteLabAnalysisResult(labId: number): Promise<void> {
    console.log(`[Storage] Deleting lab analysis result for lab ${labId}`);
    
    try {
      await db
        .delete(labAnalysisResults)
        .where(eq(labAnalysisResults.labId, labId));
      
      console.log(`[Storage] Successfully deleted analysis result for lab ${labId}`);
    } catch (error) {
      console.error(`[Storage] Error deleting lab analysis result:`, error);
      throw error;
    }
  }

  // Lab Content methods implementation
  async createLabContent(labId: number, content: InsertLabContent): Promise<LabContent> {
    console.log(`[Storage] Creating lab content for lab ${labId}`);
    
    try {
      const [newContent] = (await db
        .insert(labContent)
        .values({
          labId,
          ...content
        })
        .returning()) as LabContent[];
      
      console.log(`[Storage] Successfully created lab content with ID ${newContent.id}`);
      return newContent;
    } catch (error) {
      console.error(`[Storage] Error creating lab content:`, error);
      throw error;
    }
  }

  async getLabContent(labId: number): Promise<LabContent[]> {
    console.log(`[Storage] Getting lab content for lab ${labId}`);
    
    try {
      const content = (await db
        .select()
        .from(labContent)
        .where(eq(labContent.labId, labId))
        .orderBy(labContent.createdAt)) as LabContent[];
      
      console.log(`[Storage] Found ${content.length} content items for lab ${labId}`);
      return content;
    } catch (error) {
      console.error(`[Storage] Error getting lab content:`, error);
      throw error;
    }
  }

  async updateLabContent(id: number, updates: Partial<LabContent>): Promise<LabContent> {
    console.log(`[Storage] Updating lab content ${id}`);
    
    try {
      const [updatedContent] = (await db
        .update(labContent)
        .set(updates)
        .where(eq(labContent.id, id))
        .returning()) as LabContent[];
      
      console.log(`[Storage] Successfully updated lab content ${id}`);
      return updatedContent;
    } catch (error) {
      console.error(`[Storage] Error updating lab content:`, error);
      throw error;
    }
  }

  async deleteLabContent(id: number): Promise<void> {
    console.log(`[Storage] Deleting lab content ${id}`);
    
    try {
      await db
        .delete(labContent)
        .where(eq(labContent.id, id));
      
      console.log(`[Storage] Successfully deleted lab content ${id}`);
    } catch (error) {
      console.error(`[Storage] Error deleting lab content:`, error);
      throw error;
    }
  }

  async publishLabContent(labId: number): Promise<void> {
    console.log(`[Storage] Publishing lab content for lab ${labId}`);
    
    try {
      // Get the lab to ensure it exists and get lab info
      const lab = await this.getLab(labId);
      if (!lab) {
        throw new Error(`Lab ${labId} not found`);
      }

      // Get all content for this lab
      const labContentItems = await this.getLabContent(labId);
      
      // Get all circles associated with this lab
      const labCircles = await this.getLabCircles(labId);
      
      console.log(`[Storage] Publishing ${labContentItems.length} content items to ${labCircles.length} circles`);

      // For each content item, create posts in appropriate circles
      for (const contentItem of labContentItems) {
        const targetCircles = contentItem.targetRole === 'all' 
          ? labCircles 
          : labCircles.filter(circle => circle.role === contentItem.targetRole);

        // Create posts in each target circle
        for (const circle of targetCircles) {
          await this.createPostInCircle(
            lab.userId,
            circle.id,
            contentItem.content,
            labId,
            true, // labExperiment = true
            contentItem.targetRole
          );
        }
      }
      
      console.log(`[Storage] Successfully published lab content for lab ${labId}`);
    } catch (error) {
      console.error(`[Storage] Error publishing lab content:`, error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();