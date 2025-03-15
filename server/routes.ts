import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateAIResponse } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Broadcast AI interactions to all connected clients
  function broadcastInteraction(interaction: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(interaction));
      }
    });
  }

  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const post = await storage.createPost(req.user!.id, req.body.content);

    // Get AI followers for the user
    const followers = await storage.getAiFollowers(req.user!.id);

    // Generate AI responses
    for (const follower of followers) {
      try {
        const aiResponse = await generateAIResponse(post.content, follower.personality);

        if (aiResponse.confidence > 0.7) {
          const interaction = await storage.createAiInteraction({
            postId: post.id,
            aiFollowerId: follower.id,
            type: aiResponse.type,
            content: aiResponse.content,
          });

          // Include AI follower details in the broadcast
          const fullInteraction = {
            ...interaction,
            aiFollower: follower,
          };

          broadcastInteraction(fullInteraction);
        }
      } catch (error) {
        console.error(`AI follower ${follower.id} failed to respond:`, error);
      }
    }

    res.status(201).json(post);
  });

  app.get("/api/posts/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const posts = await storage.getUserPosts(parseInt(req.params.userId));
    const postsWithInteractions = await Promise.all(
      posts.map(async (post) => {
        const interactions = await storage.getPostInteractions(post.id);
        const interactionsWithFollowers = await Promise.all(
          interactions.map(async (interaction) => ({
            ...interaction,
            aiFollower: await storage.getAiFollower(interaction.aiFollowerId),
          }))
        );
        return {
          ...post,
          interactions: interactionsWithFollowers,
        };
      })
    );

    res.json(postsWithInteractions);
  });

  app.post("/api/posts/:postId/reply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { content, parentId } = req.body;
    const postId = parseInt(req.params.postId);

    // Get the parent interaction and its AI follower
    const parentInteraction = await storage.getInteraction(parentId);
    if (!parentInteraction) {
      return res.status(404).json({ message: "Parent interaction not found" });
    }

    const aiFollower = await storage.getAiFollower(parentInteraction.aiFollowerId);
    if (!aiFollower) {
      return res.status(404).json({ message: "AI follower not found" });
    }

    // Generate AI response to the user's reply
    const aiResponse = await generateAIResponse(
      content,
      aiFollower.personality,
    );

    if (aiResponse.confidence > 0.7) {
      const interaction = await storage.createAiInteraction({
        postId,
        aiFollowerId: aiFollower.id,
        type: "comment",
        content: aiResponse.content,
        parentId,
      });

      const fullInteraction = {
        ...interaction,
        aiFollower,
      };

      broadcastInteraction(fullInteraction);
      res.status(201).json(fullInteraction);
    } else {
      res.status(400).json({ message: "AI couldn't generate a confident response" });
    }
  });

  app.post("/api/followers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const follower = await storage.createAiFollower(req.user!.id, {
      name: req.body.name,
      personality: req.body.personality,
      avatarUrl: req.body.avatarUrl,
    });

    res.status(201).json(follower);
  });

  app.get("/api/followers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const followers = await storage.getAiFollowers(req.user!.id);
    res.json(followers);
  });

  return httpServer;
}