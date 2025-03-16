import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateAIResponse, generateAIBackground } from "./openai";
import { ThreadManager } from "./thread-manager";
import { insertReactionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  const httpServer = createServer(app);

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

    const post = await storage.createPost(req.user!.id, req.body.content);

    // Get AI followers for the user
    const followers = await storage.getAiFollowers(req.user!.id);

    // Generate AI responses
    for (const follower of followers) {
      try {
        const aiResponse = await generateAIResponse(post.content, follower.personality);

        if (aiResponse.confidence > 0.7) {
          await storage.createAiInteraction({
            postId: post.id,
            aiFollowerId: follower.id,
            userId: null,
            type: aiResponse.type || 'comment',
            content: aiResponse.content || null,
            parentId: null,
          });
        }
      } catch (error) {
        console.error(`AI follower ${follower.id} failed to respond:`, error);
      }
    }

    res.status(201).json(post);
  });

  app.post("/api/followers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Generate AI background based on name and personality
      const aiBackground = await generateAIBackground(
        req.body.name,
        req.body.personality
      );

      // Create follower with the generated background
      const follower = await storage.createAiFollower(req.user!.id, {
        name: req.body.name,
        personality: req.body.personality,
        avatarUrl: req.body.avatarUrl,
        background: aiBackground.background,
        interests: aiBackground.interests,
        communicationStyle: aiBackground.communication_style,
        interactionPreferences: aiBackground.interaction_preferences,
      });

      res.status(201).json(follower);
    } catch (error) {
      console.error("Error creating AI follower:", error);
      res.status(500).json({ message: "Failed to create AI follower" });
    }
  });

  app.get("/api/followers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const followers = await storage.getAiFollowers(req.user!.id);
    res.json(followers);
  });

  // New routes for reactions
  app.post("/api/reactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertReactionSchema.parse(req.body);
      const reaction = await storage.createReaction(req.user!.id, validatedData);
      res.status(201).json(reaction);
    } catch (error) {
      console.error("Error creating reaction:", error);
      res.status(500).json({ message: "Failed to create reaction" });
    }
  });

  app.get("/api/reactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { postId, interactionId } = req.query;
      const reactions = await storage.getReactions(
        postId ? parseInt(postId as string) : undefined,
        interactionId ? parseInt(interactionId as string) : undefined
      );
      res.json(reactions);
    } catch (error) {
      console.error("Error getting reactions:", error);
      res.status(500).json({ message: "Failed to get reactions" });
    }
  });

  app.delete("/api/reactions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      await storage.deleteReaction(parseInt(req.params.id), req.user!.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting reaction:", error);
      res.status(500).json({ message: "Failed to delete reaction" });
    }
  });

  return httpServer;
}