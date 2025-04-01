import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { ResponseScheduler } from "./response-scheduler";
import { requireAuth } from "./routes/middleware";
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
  
  // Mount API routes
  app.use('/api/user', userRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/circles', circleRoutes);
  app.use('/api/circles', circleFollowerRoutes);
  app.use('/api/circles', circleCollectiveRoutes);
  app.use('/api/followers', followerRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/direct-chat', directChatRoutes);
  app.use('/api/tools', toolRoutes);
  app.use('/api/labs', labRoutes);
  app.use('/api/nft', nftRoutes);
  app.use('/api/health', healthRoutes);
  
  // Compatibility routes for default circle
  app.get('/api/default-circle', requireAuth, async (req, res) => {
    try {
      const defaultCircle = await storage.getDefaultCircle(req.user!.id);
      res.json(defaultCircle);
    } catch (error) {
      console.error("Error getting default circle:", error);
      res.status(500).json({ message: "Failed to get default circle" });
    }
  });
  
  // Alternative endpoint path for default circle
  app.get('/api/circles/default', requireAuth, async (req, res) => {
    try {
      const defaultCircle = await storage.getDefaultCircle(req.user!.id);
      res.json(defaultCircle);
    } catch (error) {
      console.error("Error getting default circle:", error);
      res.status(500).json({ message: "Failed to get default circle" });
    }
  });
  
  // Compatibility routes for AI collectives
  
  // Legacy endpoint for AI collectives
  app.get('/api/ai-collectives', requireAuth, async (req, res) => {
    try {
      console.log("[API] (Compatibility) AI collectives request");
      const collectives = await storage.getUserAiFollowerCollectives(req.user!.id);
      res.json(collectives);
    } catch (error) {
      console.error("Error getting AI collectives:", error);
      res.status(500).json({ message: "Failed to get AI collectives" });
    }
  });
  
  // Compatibility with frontend components directly using /api/followers/collectives
  app.get('/api/followers/collectives', requireAuth, async (req, res) => {
    try {
      console.log("[API] (Compatibility) Getting AI follower collectives for user:", req.user!.id);
      const collectives = await storage.getUserAiFollowerCollectives(req.user!.id);
      res.json(collectives);
    } catch (error) {
      console.error("Error getting AI follower collectives:", error);
      res.status(500).json({ message: "Failed to get AI follower collectives" });
    }
  });
  
  // Compatibility with frontend components using /api/followers/collectives/:id
  app.get('/api/followers/collectives/:id', requireAuth, async (req, res) => {
    const collectiveId = parseInt(req.params.id);
    
    if (isNaN(collectiveId)) {
      return res.status(400).json({ message: "Invalid collective ID format" });
    }
    
    try {
      console.log("[API] (Compatibility) Getting AI follower collective:", collectiveId);
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
  
  // Compatibility with frontend components using /api/followers/collectives/:id/members
  app.get('/api/followers/collectives/:id/members', requireAuth, async (req, res) => {
    const collectiveId = parseInt(req.params.id);
    
    if (isNaN(collectiveId)) {
      return res.status(400).json({ message: "Invalid collective ID format" });
    }
    
    try {
      console.log("[API] (Compatibility) Getting AI follower collective members:", collectiveId);
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

  return httpServer;
}