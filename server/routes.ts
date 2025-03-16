import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateAIResponse, generateAIBackground } from "./openai";
import { parse as parseCookie } from "cookie";
import { getSession } from "./sessionStore";

// Previous imports and WebSocket setup remain unchanged...

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: "/ws",
    verifyClient: async (info, done) => {
      try {
        // Parse the session cookie
        const cookieHeader = info.req.headers.cookie || '';
        console.log('WebSocket connection attempt - Cookie header:', cookieHeader);

        const cookies = parseCookie(cookieHeader);
        const sid = cookies['sid'];
        console.log('Parsed session ID:', sid);

        if (!sid) {
          console.log('WebSocket connection rejected: No session cookie');
          done(false, 401, 'Unauthorized: No session cookie');
          return;
        }

        // Get session from shared session store
        const session = await getSession(sid);
        console.log('Retrieved session:', {
          exists: !!session,
          hasPassport: !!session?.passport,
          userId: session?.passport?.user
        });

        if (!session?.passport?.user) {
          console.log('WebSocket connection rejected: Invalid session');
          done(false, 401, 'Unauthorized: Invalid session');
          return;
        }

        // Attach session to request for later use
        (info.req as any).session = session;
        console.log(`WebSocket authentication successful for user: ${session.passport.user}`);
        done(true);
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        done(false, 500, 'Internal server error');
      }
    }
  });

  // Store active connections
  const clients = new Map<WebSocket, number>();

  wss.on('connection', (ws, req) => {
    const session = (req as any).session;
    const userId = session?.passport?.user;

    if (userId) {
      clients.set(ws, userId);
      console.log(`WebSocket connection established for user: ${userId}`);

      // Send initial confirmation message
      try {
        ws.send(JSON.stringify({ type: 'connected', userId }));
      } catch (error) {
        console.error(`Error sending initial message to user ${userId}:`, error);
      }

      // Handle errors with more detail
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });

      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error(`Error processing WebSocket message from user ${userId}:`, error);
        }
      });

      // Server-side ping to keep the connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          try {
            ws.send(JSON.stringify({ type: 'server-ping' }));
          } catch (error) {
            console.error(`Error sending ping to user ${userId}:`, error);
            clearInterval(pingInterval);
            if (clients.has(ws)) {
              clients.delete(ws);
              try {
                ws.close();
              } catch (closeError) {
                console.error(`Error closing WebSocket for user ${userId}:`, closeError);
              }
            }
          }
        }
      }, 30000);

      ws.on('close', () => {
        clearInterval(pingInterval);
        clients.delete(ws);
        console.log(`WebSocket connection closed for user ${userId}`);
      });
    } else {
      console.log('WebSocket connection rejected: No user ID in session');
      ws.close(1008, 'No user ID in session');
    }
  });

  // Function to broadcast to specific users or all users
  function broadcastInteraction(interaction: any) {
    const messageStr = JSON.stringify(interaction);
    let sentCount = 0;

    clients.forEach((userId, client) => {
      if (client.readyState === client.OPEN) {
        try {
          client.send(messageStr);
          sentCount++;
        } catch (error) {
          console.error(`Error sending to user ${userId}:`, error);
          clients.delete(client);
          try {
            client.close();
          } catch (closeError) {
            console.error(`Error closing WebSocket for user ${userId}:`, closeError);
          }
        }
      }
    });

    console.log(`Broadcast interaction to ${sentCount} clients`);
  }

  app.post("/api/posts/:postId/reply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { content, parentId } = req.body;
    const postId = parseInt(req.params.postId);

    try {
      // First, get the parent interaction and its AI follower
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

      // Generate AI response to the user's reply
      const aiResponse = await generateAIResponse(
        content,
        aiFollower.personality,
        parentInteraction.content || undefined
      );

      let aiReply = null;
      if (aiResponse.confidence > 0.7) {
        // Save the AI's response
        aiReply = await storage.createAiInteraction({
          postId,
          aiFollowerId: aiFollower.id,
          userId: null,
          type: "reply",
          content: aiResponse.content || null,
          parentId
        });

        console.log("Created AI reply:", aiReply);
      }

      // Get the complete thread for response
      const interactions = await storage.getPostInteractions(postId);
      console.log("Retrieved all interactions for post:", interactions.length);

      // Create a map to store interactions by their ID
      const interactionMap = new Map();

      // First pass: create interaction objects with their AI follower info
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

      // Second pass: organize into threads
      const threadedInteractions: any[] = [];
      interactions.forEach(interaction => {
        const interactionWithData = interactionMap.get(interaction.id);

        if (interaction.parentId === null) {
          // This is a top-level interaction
          threadedInteractions.push(interactionWithData);
        } else {
          // This is a reply, add it to its parent's replies array
          const parent = interactionMap.get(interaction.parentId);
          if (parent) {
            if (!parent.replies) {
              parent.replies = [];
            }
            parent.replies.push(interactionWithData);
          }
        }
      });

      // Sort replies by timestamp
      threadedInteractions.forEach(interaction => {
        if (interaction.replies) {
          interaction.replies.sort((a: any, b: any) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
      });

      // Find the complete parent thread
      const parentThread = threadedInteractions.find(interaction => 
        interaction.id === parentId || 
        interaction.replies?.some((reply: any) => reply.id === parentId)
      );

      if (!parentThread) {
        return res.status(500).json({ message: "Failed to construct reply thread" });
      }

      // Broadcast updates to all connected clients
      broadcastInteraction({
        type: 'thread-update',
        postId,
        thread: parentThread
      });

      res.status(201).json(parentThread);
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
          const interaction = await storage.createAiInteraction({
            postId: post.id,
            aiFollowerId: follower.id,
            type: aiResponse.type || 'comment',
            content: aiResponse.content || null,
            parentId: null,
          });

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
        // Get all interactions for this post
        const interactions = await storage.getPostInteractions(post.id);

        // Create a map to store interactions by their ID
        const interactionMap = new Map();

        // First pass: create interaction objects with their AI follower info
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

        // Second pass: organize into threads
        const threadedInteractions = [];
        interactions.forEach(interaction => {
          const interactionWithData = interactionMap.get(interaction.id);

          if (interaction.parentId === null) {
            // This is a top-level interaction
            threadedInteractions.push(interactionWithData);
          } else {
            // This is a reply, add it to its parent's replies array
            const parent = interactionMap.get(interaction.parentId);
            if (parent) {
              parent.replies.push(interactionWithData);
            }
          }
        });

        // Sort replies by timestamp within each thread
        threadedInteractions.forEach(interaction => {
          if (interaction.replies) {
            interaction.replies.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          }
        });

        return {
          ...post,
          interactions: threadedInteractions
        };
      })
    );

    res.json(postsWithInteractions);
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