import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateAIResponse, generateAIBackground } from "./openai";
import { ThreadManager } from "./thread-manager";
import { ResponseScheduler } from "./response-scheduler";
import { ThreadContextManager } from "./context-manager";
import { getAvailableTools } from "./tools";
import {IStorage} from "./storage"

async function hasCirclePermission(
  circleId: number,
  userId: number,
  storage: IStorage,
  requiredRole: "owner" | "collaborator" | "viewer" = "viewer"
): Promise<boolean> {
  console.log("[Permissions] Checking permissions:", { circleId, userId, requiredRole });

  const circle = await storage.getCircle(circleId);
  if (!circle) {
    console.log("[Permissions] Circle not found:", circleId);
    return false;
  }

  // Circle owner has all permissions
  if (circle.userId === userId) {
    console.log("[Permissions] User is circle owner, granting all permissions");
    return true;
  }

  // Check member role
  const members = await storage.getCircleMembers(circleId);
  const member = members.find(m => m.userId === userId);

  // Check if user has a pending invitation
  const invitations = await storage.getUserPendingInvitations(userId);
  const hasPendingInvitation = invitations.some(inv => inv.circleId === circleId && inv.status === "pending");

  if (hasPendingInvitation) {
    console.log("[Permissions] User has pending invitation, granting viewer access");
    return requiredRole === "viewer";
  }

  if (!member) {
    console.log("[Permissions] User is not a member of the circle");
    return false;
  }

  console.log("[Permissions] User role:", member.role);

  switch (requiredRole) {
    case "owner":
      console.log("[Permissions] Owner permission required, denying non-owner");
      return false;
    case "collaborator":
      const hasCollabPermission = member.role === "collaborator";
      console.log("[Permissions] Collaborator permission check:", hasCollabPermission);
      return hasCollabPermission;
    case "viewer":
      console.log("[Permissions] Viewer permission granted");
      return true;
    default:
      console.log("[Permissions] Unknown role requested:", requiredRole);
      return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  const httpServer = createServer(app);

  // Start the response scheduler
  const scheduler = ResponseScheduler.getInstance();
  scheduler.start();

  // Add new delete-all endpoint before the existing notification routes
  app.delete("/api/notifications/delete-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Delete all notifications for the current user
      // Requires importing db and notifications from database library (e.g., knex)
      // const { db, notifications } = require('./database'); //Example - Needs proper import based on your DB setup.
      //await db.delete().from('notifications').where({userId: req.user!.id}); // Example using Knex - Adapt to your ORM
      await storage.deleteAllNotifications(req.user!.id); // Assuming storage has this method.
      res.sendStatus(200);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      res.status(500).json({ message: "Failed to delete all notifications" });
    }
  });


  // Add notification routes
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.get("/api/notifications/unread/count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const count = await storage.getUnreadNotificationCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread notification count:", error);
      res.status(500).json({ message: "Failed to get unread notification count" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const notificationId = parseInt(req.params.id);
    try {
      await storage.markNotificationRead(notificationId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const notificationId = parseInt(req.params.id);
    try {
      await storage.deleteNotification(notificationId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Update the Get pending invitations endpoint to include circle information
  app.get("/api/circles/invitations/pending", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const invitations = await storage.getUserPendingInvitations(req.user!.id);

      // Get circle information for each invitation
      const invitationsWithCircles = await Promise.all(
        invitations.map(async (invitation) => {
          const circle = await storage.getCircle(invitation.circleId);
          return {
            ...invitation,
            circle
          };
        })
      );

      res.json(invitationsWithCircles);
    } catch (error) {
      console.error("Error getting pending invitations:", error);
      res.status(500).json({ message: "Failed to get pending invitations" });
    }
  });
  // Create invitation for a circle
  app.post("/api/circles/:id/invitations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    const { username, role } = req.body;

    try {
      // Verify circle ownership and existence
      const circle = await storage.getCircle(circleId);
      if (!circle || circle.userId !== req.user!.id) {
        return res.status(404).json({ message: "Circle not found" });
      }

      // Get invitee user by username
      const invitee = await storage.getUserByUsername(username);
      if (!invitee) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is already a member
      const members = await storage.getCircleMembers(circleId);
      if (members.some(member => member.userId === invitee.id)) {
        return res.status(400).json({ message: "User is already a member of this circle" });
      }

      // Check for existing pending invitation
      const invitations = await storage.getCircleInvitations(circleId);
      if (invitations.some(inv => inv.inviteeId === invitee.id && inv.status === "pending")) {
        return res.status(400).json({ message: "User already has a pending invitation" });
      }

      // Create invitation
      const invitation = await storage.createCircleInvitation({
        circleId,
        inviterId: req.user!.id,
        inviteeId: invitee.id,
        role
      });

      // Update circle visibility to shared
      if (circle.visibility === "private") {
        await storage.updateCircle(circleId, { visibility: "shared" });
      }

      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Respond to an invitation
  app.patch("/api/circles/invitations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const invitationId = parseInt(req.params.id);
    const { status } = req.body;

    try {
      const invitation = await storage.getCircleInvitation(invitationId);
      if (!invitation || invitation.inviteeId !== req.user!.id) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Invitation has already been responded to" });
      }

      const updatedInvitation = await storage.updateInvitationStatus(invitationId, status);
      console.log(`[Invitations] Invitation ${invitationId} updated to status: ${status}`); //Added Log
      res.json(updatedInvitation);
    } catch (error) {
      console.error("Error responding to invitation:", error);
      res.status(500).json({ message: "Failed to respond to invitation" });
    }
  });

  // Add before other circle routes
  app.get("/api/circles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Handle 'default' as a special case
    if (req.params.id === 'default') {
      try {
        const defaultCircle = await storage.getDefaultCircle(req.user!.id);
        res.json(defaultCircle);
      } catch (error) {
        console.error("Error getting default circle:", error);
        res.status(500).json({ message: "Failed to get default circle" });
      }
      return;
    }

    const circleId = parseInt(req.params.id);
    if (isNaN(circleId)) {
      return res.status(400).json({ message: "Invalid circle ID" });
    }

    try {
      // Check if user has access to this circle
      const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage);
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      const circle = await storage.getCircle(circleId);
      if (!circle) {
        return res.status(404).json({ message: "Circle not found" });
      }
      res.json(circle);
    } catch (error) {
      console.error("Error getting circle:", error);
      res.status(500).json({ message: "Failed to get circle" });
    }
  });


  // New Circle Management Routes
  app.get("/api/circles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const circles = await storage.getUserCircles(req.user!.id);
      const deactivatedCircles = await storage.getDeactivatedCircles(req.user!.id);

      // Reorganize circles into the new grouping structure
      const categorizedCircles = {
        private: circles.owned.filter(c => c.visibility !== "shared"),
        shared: circles.owned.filter(c => c.visibility === "shared"),
        sharedWithYou: circles.shared,
        invited: circles.invited,
        deactivated: deactivatedCircles
      };

      res.json(categorizedCircles);
    } catch (error) {
      console.error("Error getting circles:", error);
      res.status(500).json({ message: "Failed to get circles" });
    }
  });

  app.post("/api/circles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const circle = await storage.createCircle(req.user!.id, req.body);
      res.status(201).json(circle);
    } catch (error) {
      console.error("Error creating circle:", error);
      res.status(500).json({ message: "Failed to create circle" });
    }
  });

  app.patch("/api/circles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    try {
      // Verify circle ownership
      const circle = await storage.getCircle(circleId);
      if (!circle || circle.userId !== req.user!.id) {
        return res.status(404).json({ message: "Circle not found" });
      }

      const updatedCircle = await storage.updateCircle(circleId, req.body);
      res.json(updatedCircle);
    } catch (error) {
      console.error("Error updating circle:", error);
      res.status(500).json({ message: "Failed to update circle" });
    }
  });

  app.delete("/api/circles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    try {
      // Verify circle ownership
      const circle = await storage.getCircle(circleId);
      if (!circle || circle.userId !== req.user!.id) {
        return res.status(404).json({ message: "Circle not found" });
      }

      if (circle.isDefault) {
        return res.status(400).json({ message: "Cannot delete default circle" });
      }

      await storage.deleteCircle(circleId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error deleting circle:", error);
      res.status(500).json({ message: "Failed to delete circle" });
    }
  });

  // Circle Followers Management
  app.post("/api/circles/:id/followers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    const { aiFollowerId } = req.body;

    try {
      // Allow both owners and collaborators to manage followers
      const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage, "collaborator");
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Verify AI follower ownership or availability
      const follower = await storage.getAiFollower(aiFollowerId);
      if (!follower) {
        return res.status(404).json({ message: "AI follower not found" });
      }

      const circleFollower = await storage.addFollowerToCircle(circleId, aiFollowerId);
      res.status(201).json(circleFollower);
    } catch (error) {
      console.error("Error adding follower to circle:", error);
      res.status(500).json({ message: "Failed to add follower to circle" });
    }
  });

  app.delete("/api/circles/:id/followers/:followerId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    const aiFollowerId = parseInt(req.params.followerId);

    try {
      // Verify circle ownership
      const circle = await storage.getCircle(circleId);
      if (!circle || circle.userId !== req.user!.id) {
        return res.status(404).json({ message: "Circle not found" });
      }

      await storage.removeFollowerFromCircle(circleId, aiFollowerId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error removing follower from circle:", error);
      res.status(500).json({ message: "Failed to remove follower from circle" });
    }
  });

  app.get("/api/circles/:id/followers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    try {
      // Check if user has access to this circle
      const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage);
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      const followers = await storage.getCircleFollowers(circleId);
      res.json(followers);
    } catch (error) {
      console.error("Error getting circle followers:", error);
      res.status(500).json({ message: "Failed to get circle followers" });
    }
  });

  // Toggle mute status for an AI follower within a specific circle
  app.patch("/api/circles/:id/followers/:followerId/toggle-mute", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const circleId = parseInt(req.params.id);
      const followerId = parseInt(req.params.followerId);
      
      if (isNaN(circleId) || isNaN(followerId)) {
        return res.status(400).json({ message: "Invalid circle ID or follower ID" });
      }

      // Check if user has access to this circle
      const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage);
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get the follower to ensure it exists
      const follower = await storage.getAiFollower(followerId);
      if (!follower) {
        return res.status(404).json({ message: "Follower not found" });
      }

      // Toggle the mute status
      const updatedCircleFollower = await storage.toggleFollowerMuteInCircle(circleId, followerId);
      
      // Return the updated follower with muted status
      res.json({
        ...follower,
        muted: updatedCircleFollower.muted
      });
    } catch (error) {
      console.error("Error toggling follower mute status:", error);
      res.status(500).json({ message: "Failed to toggle follower mute status" });
    }
  });

  // Update the existing post creation endpoint to support circles
  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const circleId = req.body.circleId || (await storage.getDefaultCircle(req.user!.id)).id;

      // Check if user has permission to post in this circle
      const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage, "collaborator");
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions to post in this circle" });
      }

      const post = await storage.createPostInCircle(req.user!.id, circleId, req.body.content);

      // Get AI followers for the specific circle
      const followers = await storage.getCircleFollowers(circleId);

      // Schedule potential responses for each follower in the circle
      for (const follower of followers) {
        await scheduler.scheduleResponse(post.id, follower);
      }

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Update the circle posts route
  app.get("/api/circles/:id/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    try {
      // Check if user has access to this circle
      const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage);
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      const posts = await storage.getCirclePosts(circleId);

      // Get threaded interactions for each post
      const postsWithData = await Promise.all(
        posts.map(async (post) => {
          const threadedInteractions = await ThreadManager.getThreadedInteractions(post.id);
          const pendingResponses = await storage.getPostPendingResponses(post.id);

          // Get AI follower info for each pending response
          const pendingFollowers = await Promise.all(
            pendingResponses.map(async (response) => {
              const follower = await storage.getAiFollower(response.aiFollowerId);
              return follower ? {
                id: follower.id,
                name: follower.name,
                avatarUrl: follower.avatarUrl,
                scheduledFor: response.scheduledFor
              } : null;
            })
          );

          return {
            ...post,
            interactions: threadedInteractions,
            pendingResponses: pendingFollowers.filter(Boolean)
          };
        })
      );

      res.json(postsWithData);
    } catch (error) {
      console.error("Error getting circle posts:", error);
      res.status(500).json({ message: "Failed to get circle posts" });
    }
  });

  // Move a post to a different circle
  app.patch("/api/posts/:id/move", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const postId = parseInt(req.params.id);
    const { circleId } = req.body;

    try {
      // Verify post ownership
      const post = await storage.getPost(postId);
      if (!post || post.userId !== req.user!.id) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Verify circle ownership
      const circle = await storage.getCircle(circleId);
      if (!circle || circle.userId !== req.user!.id) {
        return res.status(404).json({ message: "Circle not found" });
      }

      const updatedPost = await storage.movePostToCircle(postId, circleId);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error moving post:", error);
      res.status(500).json({ message: "Failed to move post" });
    }
  });

  app.get("/api/posts/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      console.log("[Routes] Getting posts for user:", req.params.userId);
      const posts = await storage.getUserPosts(parseInt(req.params.userId));
      console.log("[Routes] Found posts:", posts.length);

      // Get threaded interactions and pending responses for each post
      const postsWithData = await Promise.all(
        posts.map(async (post) => {
          console.log("[Routes] Processing post:", post.id);
          const [threadedInteractions, pendingResponses] = await Promise.all([
            ThreadManager.getThreadedInteractions(post.id),
            storage.getPostPendingResponses(post.id)
          ]);

          console.log("[Routes] Pending responses for post", post.id, ":", pendingResponses);

          // Get AI follower info for each pending response
          const pendingFollowers = await Promise.all(
            pendingResponses.map(async (response) => {
              const follower = await storage.getAiFollower(response.aiFollowerId);
              console.log("[Routes] Found follower for response:", follower?.name);
              return follower ? {
                id: follower.id,
                name: follower.name,
                avatarUrl: follower.avatarUrl,
                scheduledFor: response.scheduledFor
              } : null;
            })
          );

          // Filter out null values and sort by scheduled time
          const validPendingFollowers = pendingFollowers
            .filter((f): f is NonNullable<typeof f> => f !== null)
            .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

          console.log("[Routes] Valid pending followers for post", post.id, ":", validPendingFollowers);

          return {
            ...post,
            interactions: threadedInteractions,
            pendingResponses: validPendingFollowers
          };
        })
      );

      res.json(postsWithData);
    } catch (error) {
      console.error("Error getting posts:", error);
      res.status(500).json({ message: "Failed to get posts" });
    }
  });

  app.post("/api/posts/:postId/reply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { content, parentId } = req.body;
    const postId = parseInt(req.params.postId);

    try {
      // Get parent interaction and its AI follower
      const parentInteraction = await storage.getInteraction(parentId);
      if (!parentInteraction) {
        return res.status(404).json({ message: "Parent interaction not found" });
      }

      // Get the AI follower associated with the parent interaction
      const targetFollower = parentInteraction.aiFollowerId ?
        await storage.getAiFollower(parentInteraction.aiFollowerId)
        : null;
      if (!targetFollower) {
        return res.status(404).json({ message: "AI follower not found" });
      }

      // Save the user's reply
      const userReply = await storage.createAiInteraction({
        postId,
        userId: req.user!.id,
        aiFollowerId: null,
        type: "reply",
        content,
        parentId
      });
      
      console.log("[Routes] Created user reply:", {
        id: userReply.id,
        postId,
        parentId,
        content: content.substring(0, 50)
      });

      // Get circle associated with this post
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const circleId = post.circleId;
      
      // Store the thread context in the pending response metadata
      const contextManager = ThreadContextManager.getInstance();
      const threadContext = await contextManager.buildThreadContext(
        userReply,
        parentInteraction,
        targetFollower
      );
      
      // Serialize context data for storage with both parentId and parentInteractionId
      // (parentInteractionId is included for backwards compatibility)
      const contextMetadata = JSON.stringify({
        threadContext,
        parentId,
        parentInteractionId: parentId
      });
      
      // Similar to regular posts, we'll now schedule potential responses
      // First, calculate a quick scheduled time for the primary target follower (the one being replied to)
      const scheduler = ResponseScheduler.getInstance();
      
      // Schedule a response from the target follower with higher priority
      await scheduler.scheduleThreadResponse(postId, targetFollower, parentId, contextMetadata);
      
      // Additionally, get other followers in the circle who might want to join the conversation
      // but with lower priority and longer delay
      const circleFollowers = await storage.getCircleFollowers(circleId);
      const otherFollowers = circleFollowers.filter(f => f.id !== targetFollower.id);
      
      // If we have other followers, give them a chance to join the thread conversation
      for (const follower of otherFollowers) {
        // We use a lower relevance boost for other followers as they weren't directly addressed
        await scheduler.scheduleThreadResponse(postId, follower, parentId, contextMetadata, false);
      }

      // Get updated thread structure with interactions
      const threadedInteractions = await ThreadManager.getThreadedInteractions(postId);
      const updatedThread = ThreadManager.findThreadById(threadedInteractions, parentId);

      if (!updatedThread) {
        return res.status(500).json({ message: "Failed to find updated thread" });
      }
      
      // Get newly scheduled pending responses for this specific thread
      const pendingResponses = await storage.getPostPendingResponses(postId);
      console.log("[Routes] Pending responses for thread:", pendingResponses.length);
      
      // Filter for responses specifically targeting the parent interaction
      const filteredResponses = pendingResponses.filter(response => {
        try {
          if (!response.metadata) return false;
          const metadata = JSON.parse(response.metadata);
          return metadata.parentInteractionId === parentId || metadata.parentId === parentId;
        } catch (e) {
          return false;
        }
      });
      
      // Format pending responses with follower information
      const pendingFollowers = await Promise.all(
        filteredResponses.map(async (response) => {
          const follower = await storage.getAiFollower(response.aiFollowerId);
          return follower ? {
            id: follower.id,
            name: follower.name,
            avatarUrl: follower.avatarUrl,
            scheduledFor: response.scheduledFor
          } : null;
        })
      );
      
      // Filter out nulls and add to the updated thread
      const validPendingFollowers = pendingFollowers
        .filter((f): f is NonNullable<typeof f> => f !== null)
        .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
      
      // Attach the pending responses to the thread
      if (validPendingFollowers.length > 0) {
        updatedThread.pendingResponses = validPendingFollowers;
      }
      
      console.log("[Routes] Thread reply response includes", 
        validPendingFollowers.length, "pending responses");

      res.status(201).json(updatedThread);
    } catch (error) {
      console.error("Error handling reply:", error);
      res.status(500).json({ message: "Failed to process reply" });
    }
  });


  // Get available AI follower tools
  app.get("/api/tools", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Get available tools without exposing implementation details
      const tools = getAvailableTools();
      res.json(tools);
    } catch (error) {
      console.error("Error getting available tools:", error);
      res.status(500).json({ message: "Failed to get available tools" });
    }
  });

  app.post("/api/followers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const aiBackground = await generateAIBackground(
        req.body.name,
        req.body.personality
      );

      // Create follower with the generated background and responsiveness settings
      const follower = await storage.createAiFollower(req.user!.id, {
        name: req.body.name,
        personality: req.body.personality,
        avatarUrl: req.body.avatarUrl,
        background: aiBackground.background,
        interests: aiBackground.interests,
        communicationStyle: aiBackground.communication_style,
        interactionPreferences: aiBackground.interaction_preferences,
        responsiveness: req.body.responsiveness || "active",
        responseDelay: getDefaultDelay(req.body.responsiveness),
        responseChance: req.body.responseChance || 80,
      });

      res.status(201).json(follower);
    } catch (error) {
      console.error("Error creating AI follower:", error);
      res.status(500).json({ message: "Failed to create AI follower" });
    }
  });

  // Helper function to get default delay based on responsiveness
  function getDefaultDelay(responsiveness: string = "active") {
    switch (responsiveness) {
      case "instant":
        return { min: 0, max: 5 };
      case "active":
        return { min: 5, max: 60 };
      case "casual":
        return { min: 60, max: 480 }; // 1-8 hours
      case "zen":
        return { min: 480, max: 1440 }; // 8-24 hours
      default:
        return { min: 5, max: 60 };
    }
  }

  app.get("/api/followers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const followers = await storage.getAiFollowers(req.user!.id);
    res.json(followers);
  });
  
  // Get a single AI follower by ID
  app.get("/api/followers/:id", async (req, res) => {
    console.log(`[API] GET /api/followers/:id - Request received for ID: ${req.params.id}`);
    console.log(`[API] Authentication status: ${req.isAuthenticated()}`);
    
    if (!req.isAuthenticated()) {
      console.log(`[API] Request rejected: User not authenticated`);
      return res.sendStatus(401);
    }
    
    const followerId = parseInt(req.params.id);
    console.log(`[API] Parsed follower ID: ${followerId}, isNaN: ${isNaN(followerId)}`);
    
    if (isNaN(followerId)) {
      console.log(`[API] Request rejected: Invalid follower ID format`);
      return res.status(400).json({ message: "Invalid follower ID" });
    }
    
    try {
      console.log(`[API] Looking up follower with ID: ${followerId} for user: ${req.user!.id}`);
      
      // First verify the follower belongs to the user
      const follower = await storage.getAiFollower(followerId);
      console.log(`[API] Follower lookup result:`, follower ? 
        `Found (userId: ${follower.userId}, name: ${follower.name})` : 
        `Not found`);
      
      if (!follower) {
        console.log(`[API] Request rejected: Follower not found`);
        return res.status(404).json({ message: "Follower not found" });
      }
      
      if (follower.userId !== req.user!.id) {
        console.log(`[API] Request rejected: Follower belongs to different user (${follower.userId})`);
        return res.status(404).json({ message: "Follower not found" });
      }
      
      console.log(`[API] Sending successful response for follower: ${follower.name}`);
      res.json(follower);
    } catch (error) {
      console.error("[API] Error getting AI follower:", error);
      res.status(500).json({ message: "Failed to get AI follower" });
    }
  });

  app.patch("/api/followers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const followerId = parseInt(req.params.id);
    
    console.log(`[API] PATCH /api/followers/:id - Request received for ID: ${followerId}`);
    console.log(`[API] Request body:`, req.body);

    try {
      // First verify the follower belongs to the user
      const follower = await storage.getAiFollower(followerId);
      if (!follower || follower.userId !== req.user!.id) {
        console.log(`[API] Update rejected: Follower not found or belongs to different user`);
        return res.status(404).json({ message: "Follower not found" });
      }

      // Check if this is Tom (default follower)
      const isDefaultTom = follower.id === 1 || follower.name.toLowerCase().includes('tom');
      console.log(`[API] Is default Tom follower: ${isDefaultTom}`);
      
      // Create update object with basic fields
      const updateData: Partial<Pick<AiFollower, "name" | "personality" | "responsiveness" | "background" | "communicationStyle" | "tools">> = {
        name: req.body.name,
        personality: req.body.personality,
        responsiveness: req.body.responsiveness,
      };
      
      // Add extended fields if not the default Tom follower
      if (!isDefaultTom) {
        console.log(`[API] Processing extended fields for non-Tom follower`);
        
        // Add optional fields
        if (req.body.background !== undefined) {
          updateData.background = req.body.background;
        }
        
        if (req.body.communicationStyle !== undefined) {
          updateData.communicationStyle = req.body.communicationStyle;
        }
        
        // If we have tools, add them
        if (req.body.tools !== undefined) {
          updateData.tools = req.body.tools;
          console.log(`[API] Updated tools: ${JSON.stringify(req.body.tools)}`);
        }
        
        // If we have interests, parse and add them
        if (req.body.interests !== undefined) {
          await storage.updateFollowerInterests(followerId, req.body.interests);
          console.log(`[API] Updated interests: ${JSON.stringify(req.body.interests)}`);
        }
        
        // If we have interaction preferences, parse and add them
        if (req.body.interactionPreferences !== undefined) {
          await storage.updateFollowerInteractionPreferences(
            followerId, 
            req.body.interactionPreferences.likes || [],
            req.body.interactionPreferences.dislikes || []
          );
          console.log(`[API] Updated interaction preferences`);
        }
      }

      // Update the follower with the basic fields
      console.log(`[API] Updating follower with data:`, updateData);
      const updatedFollower = await storage.updateAiFollower(followerId, updateData);

      console.log(`[API] Follower updated successfully`);
      res.json(updatedFollower);
    } catch (error) {
      console.error("[API] Error updating AI follower:", error);
      res.status(500).json({ message: "Failed to update AI follower" });
    }
  });

  app.delete("/api/followers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const followerId = parseInt(req.params.id);

    try {
      // First verify the follower belongs to the user
      const follower = await storage.getAiFollower(followerId);
      if (!follower || follower.userId !== req.user!.id) {
        return res.status(404).json({ message: "Follower not found" });
      }

      // Toggle activation status
      const updatedFollower = follower.active
        ? await storage.deactivateAiFollower(followerId)
        : await storage.reactivateAiFollower(followerId);

      res.json(updatedFollower);
    } catch (error) {
      console.error("Error updating AI follower status:", error);
      res.status(500).json({ message: "Failed to update AI follower status" });
    }
  });

  // Direct Chat Endpoints
  app.get("/api/direct-chat/:followerId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const followerId = parseInt(req.params.followerId);
    const userId = req.user!.id;
    
    try {
      // First verify the follower belongs to the user
      const follower = await storage.getAiFollower(followerId);
      if (!follower || follower.userId !== userId) {
        return res.status(404).json({ message: "Follower not found" });
      }
      
      // Get chat history
      const chatHistory = await storage.getDirectChatHistory(userId, followerId);
      res.json(chatHistory);
    } catch (error) {
      console.error("Error getting direct chat history:", error);
      res.status(500).json({ message: "Failed to get chat history" });
    }
  });
  
  app.post("/api/direct-chat/:followerId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const followerId = parseInt(req.params.followerId);
    const userId = req.user!.id;
    const { message } = req.body;
    
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }
    
    try {
      // First verify the follower belongs to the user
      const follower = await storage.getAiFollower(followerId);
      if (!follower || follower.userId !== userId) {
        return res.status(404).json({ message: "Follower not found" });
      }
      
      // Create user message
      const userMessage = await storage.createDirectChatMessage({
        userId,
        aiFollowerId: followerId,
        content: message,
        isUserMessage: true
      });
      
      // Generate AI response immediately (overriding normal responsiveness)
      const response = await generateAIResponse(message, follower);
      
      // Parse the response
      let content = "";
      if (response && typeof response === "object") {
        if ("content" in response && response.content) {
          content = response.content;
        }
      } else if (typeof response === "string") {
        content = response;
      }
      
      // Create AI response
      const aiMessage = await storage.createDirectChatMessage({
        userId,
        aiFollowerId: followerId,
        content,
        isUserMessage: false
      });
      
      // Return both messages
      res.json([userMessage, aiMessage]);
    } catch (error) {
      console.error("Error in direct chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Add endpoint to get circle details including members and followers
  app.get("/api/circles/:id/details", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    try {
      // Check if user has access to this circle
      const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage);
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      const details = await storage.getCircleWithDetails(circleId);
      if (!details) {
        return res.status(404).json({ message: "Circle not found" });
      }

      res.json(details);
    } catch (error) {
      console.error("Error getting circle details:", error);
      res.status(500).json({ message: "Failed to get circle details" });
    }
  });

  // Deactivate a circle member
  app.post("/api/circles/:id/members/:userId/deactivate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);

    try {
      // Check if user has permission to manage members
      const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage, "owner");
      if (!hasPermission) {
        return res.status(403).json({ message: "Only circle owners can deactivate members" });
      }

      // Can't deactivate the owner
      const circle = await storage.getCircle(circleId);
      if (circle?.userId === targetUserId) {
        return res.status(400).json({ message: "Cannot deactivate the circle owner" });
      }

      await storage.deactivateCircleMember(circleId, targetUserId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error deactivating circle member:", error);
      res.status(500).json({ message: "Failed to deactivate circle member" });
    }
  });

  // Reactivate a circle member
  app.post("/api/circles/:id/members/:userId/reactivate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);

    try {
      // Check if user has permission to manage members
      const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage, "owner");
      if (!hasPermission) {
        return res.status(403).json({ message: "Only circle owners can reactivate members" });
      }

      await storage.reactivateCircleMember(circleId, targetUserId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error reactivating circle member:", error);
      res.status(500).json({ message: "Failed to reactivate circle member" });
    }
  });

  // Get deactivated circles
  app.get("/api/circles/deactivated", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const circles = await storage.getDeactivatedCircles(req.user!.id);
      res.json(circles);
    } catch (error) {
      console.error("Error getting deactivated circles:", error);
      res.status(500).json({ message: "Failed to get deactivated circles" });
    }
  });

  return httpServer;
}