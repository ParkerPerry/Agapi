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
  
  // Compatibility route for AI collectives (old URL format)
  app.get('/api/ai-collectives', requireAuth, async (req, res) => {
    try {
      // Redirect to the proper endpoint in followerRoutes.ts
      console.log("[API] (Compatibility) Redirecting AI collectives request to /api/followers/collectives");
      const collectives = await storage.getUserAiFollowerCollectives(req.user!.id);
      res.json(collectives);
    } catch (error) {
      console.error("Error getting AI collectives:", error);
      res.status(500).json({ message: "Failed to get AI collectives" });
    }
  });

  return httpServer;
}