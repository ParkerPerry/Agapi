import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateAIResponse, generateAIBackground } from "./openai";

function organizeThreadedInteractions(interactions: any[], interactionMap: Map<any, any>) {
  const threadedInteractions: any[] = [];

  // Helper function to recursively organize replies
  function addReplies(parentId: number | null) {
    const replies = interactions
      .filter(interaction => interaction.parentId === parentId)
      .map(interaction => {
        const interactionWithData = interactionMap.get(interaction.id);
        // Recursively get nested replies
        const nestedReplies = addReplies(interaction.id);
        return {
          ...interactionWithData,
          replies: nestedReplies
        };
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return replies;
  }

  // Get top-level interactions (no parent)
  const topLevelInteractions = interactions
    .filter(interaction => interaction.parentId === null)
    .map(interaction => {
      const interactionWithData = interactionMap.get(interaction.id);
      const replies = addReplies(interaction.id);
      return {
        ...interactionWithData,
        replies
      };
    });

  return topLevelInteractions;
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  const httpServer = createServer(app);

  app.post("/api/posts/:postId/reply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { content, parentId } = req.body;
    const postId = parseInt(req.params.postId);

    try {
      // Get parent interaction and AI follower
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

      // Save user's reply
      const userReply = await storage.createAiInteraction({
        postId,
        userId: req.user!.id,
        aiFollowerId: null,
        type: "reply",
        content,
        parentId
      });

      console.log("Created user reply:", userReply);

      // Generate AI response to the user's reply
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

      // Get all interactions for the post
      const interactions = await storage.getPostInteractions(postId);
      console.log("Retrieved all interactions for post:", interactions.length);

      // Create a map to store interactions by their ID
      const interactionMap = new Map();

      // Build interaction map with AI follower info
      await Promise.all(
        interactions.map(async (interaction) => {
          const follower = interaction.aiFollowerId ? 
            await storage.getAiFollower(interaction.aiFollowerId) 
            : null;

          interactionMap.set(interaction.id, {
            ...interaction,
            aiFollower: follower,
            replies: []
          });
        })
      );

      // Organize interactions into threads
      const threadedInteractions = organizeThreadedInteractions(interactions, interactionMap);

      res.status(201).json({
        success: true,
        message: "Reply created successfully"
      });
    } catch (error) {
      console.error("Error handling reply:", error);
      res.status(500).json({ message: "Failed to process reply" });
    }
  });

  app.get("/api/posts/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const posts = await storage.getUserPosts(parseInt(req.params.userId));
    const postsWithInteractions = await Promise.all(
      posts.map(async (post) => {
        const interactions = await storage.getPostInteractions(post.id);
        const interactionMap = new Map();

        await Promise.all(
          interactions.map(async (interaction) => {
            const aiFollower = interaction.aiFollowerId ? 
              await storage.getAiFollower(interaction.aiFollowerId) 
              : null;

            interactionMap.set(interaction.id, {
              ...interaction,
              aiFollower,
              replies: []
            });
          })
        );

        const threadedInteractions = organizeThreadedInteractions(interactions, interactionMap);

        return {
          ...post,
          interactions: threadedInteractions
        };
      })
    );

    res.json(postsWithInteractions);
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

  return httpServer;
}