import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateAIResponse, generateAIBackground } from "./openai";
import { ThreadManager } from "./thread-manager";
import { ResponseScheduler } from "./response-scheduler";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  const httpServer = createServer(app);

  // Start the response scheduler
  const scheduler = ResponseScheduler.getInstance();
  scheduler.start();

  app.get("/api/posts/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const posts = await storage.getUserPosts(parseInt(req.params.userId));

      // Get threaded interactions for each post
      const postsWithInteractions = await Promise.all(
        posts.map(async (post) => {
          const threadedInteractions = await ThreadManager.getThreadedInteractions(post.id);
          return {
            ...post,
            interactions: threadedInteractions
          };
        })
      );

      res.json(postsWithInteractions);
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

      console.log("Created user reply:", userReply);

      // Generate and save AI response
      const aiResponse = await generateAIResponse(
        content,
        aiFollower.personality,
        parentInteraction.content || undefined
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

  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const post = await storage.createPost(req.user!.id, req.body.content);

      // Get AI followers for the user
      const followers = await storage.getAiFollowers(req.user!.id);

      // Schedule potential responses for each follower
      for (const follower of followers) {
        await scheduler.scheduleResponse(post.id, follower);
      }

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
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

  return httpServer;
}