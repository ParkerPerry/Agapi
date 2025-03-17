import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateAIResponse, generateAIBackground } from "./openai";
import { ThreadManager } from "./thread-manager";
import { ResponseScheduler } from "./response-scheduler";
import { ThreadContextManager } from "./context-manager";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  const httpServer = createServer(app);

  // Start the response scheduler
  const scheduler = ResponseScheduler.getInstance();
  scheduler.start();

  // Get pending invitations for the current user
  app.get("/api/circles/invitations/pending", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const invitations = await storage.getUserPendingInvitations(req.user!.id);
      res.json(invitations);
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

  // Helper function to check if user has permission in circle
  async function hasCirclePermission(userId: number, circleId: number): Promise<{
    hasPermission: boolean;
    isOwner: boolean;
    isCollaborator: boolean;
  }> {
    const circle = await storage.getCircle(circleId);
    if (!circle) return { hasPermission: false, isOwner: false, isCollaborator: false };

    const isOwner = circle.userId === userId;
    if (isOwner) return { hasPermission: true, isOwner: true, isCollaborator: false };

    const members = await storage.getCircleMembers(circleId);
    const isCollaborator = members.some(
      member => member.userId === userId && member.role === "collaborator"
    );

    return { 
      hasPermission: isCollaborator, 
      isOwner: false, 
      isCollaborator 
    };
  }

  // Update circle follower management routes to allow collaborators
  app.post("/api/circles/:id/followers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    const { aiFollowerId } = req.body;

    try {
      const { hasPermission, isOwner } = await hasCirclePermission(req.user!.id, circleId);

      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to manage followers" });
      }

      // Verify AI follower ownership only if not the circle owner
      if (!isOwner) {
        const follower = await storage.getAiFollower(aiFollowerId);
        if (!follower || follower.userId !== req.user!.id) {
          return res.status(404).json({ message: "AI follower not found" });
        }
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
      const { hasPermission } = await hasCirclePermission(req.user!.id, circleId);

      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to manage followers" });
      }

      await storage.removeFollowerFromCircle(circleId, aiFollowerId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error removing follower from circle:", error);
      res.status(500).json({ message: "Failed to remove follower from circle" });
    }
  });

  // Update post creation endpoint to allow collaborators
  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const circleId = req.body.circleId || (await storage.getDefaultCircle(req.user!.id)).id;

      // Only check permissions for non-default circles
      if (circleId !== (await storage.getDefaultCircle(req.user!.id)).id) {
        const { hasPermission } = await hasCirclePermission(req.user!.id, circleId);

        if (!hasPermission) {
          return res.status(403).json({ message: "Not authorized to post in this circle" });
        }
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

  // Get circle details including members and followers
  app.get("/api/circles/:id/details", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    try {
      const details = await storage.getCircleWithDetails(circleId);
      if (!details) {
        return res.status(404).json({ message: "Circle not found" });
      }

      // Check if user has access to this circle
      const { hasPermission } = await hasCirclePermission(req.user!.id, circleId);
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(details);
    } catch (error) {
      console.error("Error getting circle details:", error);
      res.status(500).json({ message: "Failed to get circle details" });
    }
  });

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
      const circle = await storage.getCircle(circleId);
      if (!circle || circle.userId !== req.user!.id) {
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
      res.json(circles);
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

  app.get("/api/circles/:id/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const circleId = parseInt(req.params.id);
    try {
      // Verify circle ownership
      const circle = await storage.getCircle(circleId);
      if (!circle || circle.userId !== req.user!.id) {
        return res.status(404).json({ message: "Circle not found" });
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

      const aiFollower = parentInteraction.aiFollowerId ?
        await storage.getAiFollower(parentInteraction.aiFollowerId)
        : null;
      if (!aiFollower) {
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

      // Build thread context using the context manager
      const contextManager = ThreadContextManager.getInstance();
      const threadContext = await contextManager.buildThreadContext(
        userReply,
        parentInteraction,
        aiFollower
      );

      // Generate and save AI response with thread context
      const aiResponse = await generateAIResponse(
        content,
        aiFollower.personality,
        parentInteraction.content || undefined,
        threadContext
      );

      if (aiResponse.confidence > 0.7) {
        // Save the AI's response
        const aiReply = await storage.createAiInteraction({
          postId,
          aiFollowerId: aiFollower.id,
          userId: null,
          type: "reply",
          content: aiResponse.content || null,
          parentId
        });

        console.log("Created AI reply:", aiReply);
      }

      // Get updated thread structure
      const threadedInteractions = await ThreadManager.getThreadedInteractions(postId);
      const updatedThread = ThreadManager.findThreadById(threadedInteractions, parentId);

      if (!updatedThread) {
        return res.status(500).json({ message: "Failed to find updated thread" });
      }

      res.status(201).json(updatedThread);
    } catch (error) {
      console.error("Error handling reply:", error);
      res.status(500).json({ message: "Failed to process reply" });
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

  app.patch("/api/followers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const followerId = parseInt(req.params.id);

    try {
      // First verify the follower belongs to the user
      const follower = await storage.getAiFollower(followerId);
      if (!follower || follower.userId !== req.user!.id) {
        return res.status(404).json({ message: "Follower not found" });
      }

      // Update the follower
      const updatedFollower = await storage.updateAiFollower(followerId, {
        name: req.body.name,
        personality: req.body.personality,
        responsiveness: req.body.responsiveness,
      });

      res.json(updatedFollower);
    } catch (error) {
      console.error("Error updating AI follower:", error);
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

  return httpServer;
}