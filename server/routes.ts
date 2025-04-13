import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { ResponseScheduler } from "./response-scheduler";
import { requireAuth, hasCirclePermission } from "./routes/middleware";
import nftRoutes from "./blockchain/routes";

// Import modularized routes
import userRoutes from "./routes/userRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import circleRoutes from "./routes/circleRoutes";
import circleFollowerRoutes from "./routes/circleFollowerRoutes";
import circleCollectiveRoutes from "./routes/circleCollectiveRoutes";
import followerRoutes from "./routes/followerRoutes";
import postRoutes from "./routes/postRoutes";
import directChatRoutes from "./routes/directChatRoutes";
import toolRoutes from "./routes/toolRoutes";
import labRoutes from "./routes/labRoutes";
import healthRoutes from "./routes/healthRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  const httpServer = createServer(app);

  // Start the response scheduler
  const scheduler = ResponseScheduler.getInstance();
  scheduler.start();
  
  // Since we're using a separate Python server on port 3000 for test reports
  // We don't need to serve them from this Express server
  
  // ===========================================================================
  // DIRECT API ROUTES - Register these first to ensure they take precedence
  // ===========================================================================
  
  // ------------------- AI Followers Routes -------------------
  // Direct endpoint for getting all AI followers
  app.get('/api/followers', requireAuth, async (req, res) => {
    try {
      console.log("[API] Getting AI followers for user:", req.user!.id);
      const followers = await storage.getAiFollowers(req.user!.id);
      res.json(followers);
    } catch (error) {
      console.error("Error getting AI followers:", error);
      res.status(500).json({ message: "Failed to get AI followers" });
    }
  });
  
  // ------------------- AI Follower Collectives Routes -------------------
  // Direct endpoint to fix the AI collectives issue
  app.get('/api/followers/collectives', requireAuth, async (req, res) => {
    try {
      console.log("[API] Getting AI follower collectives for user:", req.user!.id);
      const collectives = await storage.getUserAiFollowerCollectives(req.user!.id);
      res.json(collectives);
    } catch (error) {
      console.error("Error getting AI follower collectives:", error);
      res.status(500).json({ message: "Failed to get AI follower collectives" });
    }
  });
  
  // Direct endpoint for getting a single collective by ID
  app.get('/api/followers/collectives/:id', requireAuth, async (req, res) => {
    const collectiveId = parseInt(req.params.id);
    
    if (isNaN(collectiveId)) {
      return res.status(400).json({ message: "Invalid collective ID format" });
    }
    
    try {
      console.log("[API] Getting AI follower collective:", collectiveId);
      const collective = await storage.getAiFollowerCollective(collectiveId);
      if (!collective) {
        return res.status(404).json({ message: "Collective not found" });
      }
      
      res.json(collective);
    } catch (error) {
      console.error("Error getting collective:", error);
      res.status(500).json({ message: "Failed to get collective" });
    }
  });
  
  // Direct endpoint for getting collective members
  app.get('/api/followers/collectives/:id/members', requireAuth, async (req, res) => {
    const collectiveId = parseInt(req.params.id);
    
    if (isNaN(collectiveId)) {
      return res.status(400).json({ message: "Invalid collective ID format" });
    }
    
    try {
      console.log("[API] Getting AI follower collective members:", collectiveId);
      const collective = await storage.getAiFollowerCollective(collectiveId);
      if (!collective) {
        return res.status(404).json({ message: "Collective not found" });
      }
      
      // Get follower members
      const followers = await storage.getCollectiveMembers(collectiveId);
      
      // Check if the client is expecting just the members array
      const wantsOnlyMembersArray = req.query.membersOnly === 'true';
      
      if (wantsOnlyMembersArray) {
        // Return just the members array for the updated frontend component
        res.json(followers);
      } else {
        // Return collective with members and creator info for backwards compatibility
        const creatorInfo = await storage.getUser(collective.userId);
        res.json({
          ...collective,
          followers,
          creator: creatorInfo ? {
            id: creatorInfo.id,
            username: creatorInfo.username
          } : undefined
        });
      }
    } catch (error) {
      console.error("Error getting collective members:", error);
      res.status(500).json({ message: "Failed to get collective members" });
    }
  });
  
  // Legacy endpoint for AI collectives compatibility
  app.get('/api/ai-collectives', requireAuth, async (req, res) => {
    try {
      console.log("[API] (Legacy) Getting AI collectives request");
      const collectives = await storage.getUserAiFollowerCollectives(req.user!.id);
      res.json(collectives);
    } catch (error) {
      console.error("Error getting AI collectives:", error);
      res.status(500).json({ message: "Failed to get AI collectives" });
    }
  });
  
  // ------------------- Circle Follower Management Routes -------------------
  // Direct endpoint for getting circle followers
  app.get('/api/circles/:circleId/followers', requireAuth, async (req, res) => {
    const circleId = parseInt(req.params.circleId);
    
    try {
      // Check if user has access to this circle
      const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage);
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log("[API] Getting circle followers for circle:", circleId);
      const followers = await storage.getCircleFollowers(circleId);
      res.json(followers);
    } catch (error) {
      console.error("Error getting circle followers:", error);
      res.status(500).json({ message: "Failed to get circle followers" });
    }
  });

  // Direct endpoint for adding a follower to a circle
  app.post('/api/circles/:circleId/followers', requireAuth, async (req, res) => {
    const circleId = parseInt(req.params.circleId);
    const { aiFollowerId } = req.body;

    try {
      // Allow both owners and collaborators to manage followers
      const hasPermission = await hasCirclePermission(
        circleId, 
        req.user!.id, 
        storage,
        "collaborator"
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Verify follower exists
      const follower = await storage.getAiFollower(aiFollowerId);
      if (!follower) {
        return res.status(404).json({ message: "AI Follower not found" });
      }

      // Check if follower is already in the circle
      const followers = await storage.getCircleFollowers(circleId);
      if (followers.some(f => f.id === aiFollowerId)) {
        return res.status(400).json({ message: "AI Follower is already in this circle" });
      }

      console.log("[API] Adding follower to circle:", circleId, aiFollowerId);
      // Add follower to circle
      await storage.addCircleFollower(circleId, aiFollowerId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error adding follower to circle:", error);
      res.status(500).json({ message: "Failed to add follower to circle" });
    }
  });

  // Direct endpoint for removing a follower from a circle
  app.delete('/api/circles/:circleId/followers/:followerId', requireAuth, async (req, res) => {
    const circleId = parseInt(req.params.circleId);
    const followerId = parseInt(req.params.followerId);

    try {
      // Allow both owners and collaborators to manage followers
      const hasPermission = await hasCirclePermission(
        circleId, 
        req.user!.id, 
        storage,
        "collaborator"
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log("[API] Removing follower from circle:", circleId, followerId);
      // Remove follower from circle
      await storage.removeCircleFollower(circleId, followerId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error removing follower from circle:", error);
      res.status(500).json({ message: "Failed to remove follower from circle" });
    }
  });

  // Direct endpoint for toggling follower mute status
  app.patch('/api/circles/:circleId/followers/:followerId/toggle-mute', requireAuth, async (req, res) => {
    const circleId = parseInt(req.params.circleId);
    const followerId = parseInt(req.params.followerId);
    
    try {
      // Allow both owners and collaborators to manage followers
      const hasPermission = await hasCirclePermission(
        circleId, 
        req.user!.id, 
        storage,
        "collaborator"
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get the current follower state
      const follows = await storage.getCircleFollowerRelationship(circleId, followerId);
      if (!follows) {
        return res.status(404).json({ message: "Follower not found in this circle" });
      }

      // Toggle mute status
      const muted = !follows.muted;
      await storage.updateCircleFollowerRelationship(circleId, followerId, { muted });
      res.json({ muted });
    } catch (error) {
      console.error("Error toggling follower mute status:", error);
      res.status(500).json({ message: "Failed to toggle follower mute status" });
    }
  });
  
  // ------------------- Default Circle Routes -------------------
  // Default circle compatibility endpoints
  app.get('/api/default-circle', requireAuth, async (req, res) => {
    try {
      const defaultCircle = await storage.getDefaultCircle(req.user!.id);
      res.json(defaultCircle);
    } catch (error) {
      console.error("Error getting default circle:", error);
      res.status(500).json({ message: "Failed to get default circle" });
    }
  });
  
  app.get('/api/circles/default', requireAuth, async (req, res) => {
    try {
      const defaultCircle = await storage.getDefaultCircle(req.user!.id);
      res.json(defaultCircle);
    } catch (error) {
      console.error("Error getting default circle:", error);
      res.status(500).json({ message: "Failed to get default circle" });
    }
  });
  
  // ===========================================================================
  // MODULAR ROUTES - Register these after direct API routes
  // ===========================================================================
  
  // Register general API routes
  app.use('/api/user', userRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/direct-chat', directChatRoutes);
  app.use('/api/tools', toolRoutes);
  app.use('/api/labs', labRoutes);
  app.use('/api/nft', nftRoutes);
  app.use('/api/health', healthRoutes);
  
  // Register circle-related routes
  app.use('/api/circles', circleRoutes);
  app.use('/api/circles', circleFollowerRoutes);
  app.use('/api/circles', circleCollectiveRoutes);
  
  // Register follower routes last so our direct routes above take precedence
  app.use('/api/followers', followerRoutes);

  return httpServer;
}