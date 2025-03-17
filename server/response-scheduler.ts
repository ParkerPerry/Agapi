import { storage } from "./storage";
import { generateAIResponse } from "./openai";
import { PendingResponse, AiFollower } from "@shared/schema";
import OpenAI from "openai";

export class ResponseScheduler {
  private static instance: ResponseScheduler;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): ResponseScheduler {
    if (!ResponseScheduler.instance) {
      ResponseScheduler.instance = new ResponseScheduler();
    }
    return ResponseScheduler.instance;
  }

  private async calculateRelevanceScore(postContent: string, follower: AiFollower): Promise<number> {
    try {
      console.log("[ResponseScheduler] Starting relevance calculation for:", {
        followerId: follower.id,
        followerName: follower.name,
        postContentPreview: postContent.substring(0, 100)
      });

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Build a comprehensive prompt that compares the post content with follower's profile
      const systemPrompt = `You are an AI that analyzes content relevance. 
        Your task is to determine how relevant a social media post is to a specific follower's profile.
        You must return a high relevance score (0.8-1.0) if the post content strongly matches the follower's expertise.

        Follower Profile:
        - Interests: ${follower.interests?.join(', ') || 'None specified'}
        - Personality: ${follower.personality}
        - Communication style: ${follower.communicationStyle || 'Not specified'}
        - Likes: ${follower.interactionPreferences?.likes?.join(', ') || 'None specified'}
        - Dislikes: ${follower.interactionPreferences?.dislikes?.join(', ') || 'None specified'}

        Analyze the post content and calculate a relevance score based on:
        1. Topic alignment with interests (50% weight)
        2. Emotional/personality match (25% weight)
        3. Communication style compatibility (25% weight)

        A score above 0.8 means the follower should definitely respond.
        A score between 0.5-0.8 means the follower might be interested.
        A score below 0.5 means the follower probably won't engage.

        Return a JSON object with:
        {
          "relevance": number between 0 and 1,
          "reasoning": {
            "topicMatch": string explaining topic relevance,
            "personalityMatch": string explaining personality alignment,
            "styleMatch": string explaining communication style fit
          }
        }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Analyze this post content: "${postContent}"`
          }
        ],
        response_format: { type: "json_object" }
      });

      if (!response.choices[0].message.content) {
        console.warn("[ResponseScheduler] No content in relevance analysis response");
        return 0.5; // Default to neutral if no response
      }

      const result = JSON.parse(response.choices[0].message.content);

      // Detailed logging of the analysis
      console.log("[ResponseScheduler] Relevance analysis complete:", {
        follower: follower.name,
        postContent: postContent.substring(0, 50) + "...",
        score: result.relevance,
        reasoning: result.reasoning
      });

      return result.relevance;
    } catch (error) {
      console.error("[ResponseScheduler] Error calculating relevance:", error);
      // Log the full error details
      if (error instanceof Error) {
        console.error("[ResponseScheduler] Error details:", {
          message: error.message,
          stack: error.stack,
          follower: follower.name,
          postContent: postContent.substring(0, 50)
        });
      }
      return 0.5; // Default to neutral on error
    }
  }

  public async scheduleResponse(postId: number, follower: AiFollower): Promise<void> {
    try {
      console.log(`[ResponseScheduler] Starting response scheduling for post ${postId} and follower ${follower.id}`);

      // Get post content for relevance analysis
      const post = await storage.getPost(postId);
      if (!post) {
        console.error(`[ResponseScheduler] Post ${postId} not found`);
        return;
      }

      // Calculate content relevance
      const relevanceScore = await this.calculateRelevanceScore(post.content, follower);
      console.log(`[ResponseScheduler] Post ${postId} relevance for follower ${follower.id}: ${relevanceScore}`);

      // Higher base chance (50%) and stronger relevance impact
      const baseChance = 50; // Base 50% chance to respond
      const relevanceMultiplier = 3.0; // Stronger relevance impact
      const adjustedChance = baseChance * (relevanceScore * relevanceMultiplier);

      // Log the decision making process
      console.log(`[ResponseScheduler] Response probability calculation:`, {
        followerId: follower.id,
        followerName: follower.name,
        baseChance,
        relevanceScore,
        finalChance: Math.min(adjustedChance, 100),
        expertise: follower.interests,
        personality: follower.personality
      });

      // Determine if follower will respond based on adjusted chance
      const randomChance = Math.random() * 100;
      const finalChance = Math.min(adjustedChance, 100);

      if (randomChance > finalChance) {
        console.log(`[ResponseScheduler] Follower ${follower.id} chose not to respond:`, {
          randomValue: randomChance,
          requiredChance: finalChance
        });
        return;
      }

      // Calculate delay based on follower's responsiveness
      const delay = this.calculateDelay(follower);
      const scheduledTime = new Date(Date.now() + delay * 60 * 1000); // Convert minutes to milliseconds

      await storage.createPendingResponse({
        postId,
        aiFollowerId: follower.id,
        scheduledFor: scheduledTime,
        processed: false,
      });

      console.log(`[ResponseScheduler] Successfully scheduled response:`, {
        followerId: follower.id,
        postId,
        scheduledTime,
        delay
      });
    } catch (error) {
      console.error(`[ResponseScheduler] Error scheduling response:`, error);
      // Log detailed error information
      if (error instanceof Error) {
        console.error("[ResponseScheduler] Error details:", {
          message: error.message,
          stack: error.stack,
          followerId: follower.id,
          postId
        });
      }
    }
  }

  private calculateDelay(follower: AiFollower): number {
    // Define delay ranges based on responsiveness level
    const delays = {
      instant: { min: 1, max: 5 },
      active: { min: 5, max: 60 },
      casual: { min: 60, max: 480 },
      zen: { min: 480, max: 1440 }
    };

    const range = delays[follower.responsiveness] || delays.active;
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  /**
   * Start the scheduler that processes pending responses
   */
  public start(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      try {
        const pendingResponses = await storage.getPendingResponses();
        console.log(`[ResponseScheduler] Processing ${pendingResponses.length} pending responses`);

        for (const response of pendingResponses) {
          if (this.shouldProcess(response)) {
            await this.processResponse(response);
          }
        }
      } catch (error) {
        console.error("[ResponseScheduler] Error processing responses:", error);
      }
    }, 60000); // Check every minute

    console.log("[ResponseScheduler] Started response scheduler");
  }

  private shouldProcess(response: PendingResponse): boolean {
    return !response.processed && new Date(response.scheduledFor) <= new Date();
  }

  private async processResponse(response: PendingResponse): Promise<void> {
    try {
      const post = await storage.getPost(response.postId);
      const follower = await storage.getAiFollower(response.aiFollowerId);

      if (!post || !follower) {
        console.error(`[ResponseScheduler] Missing post or follower for response ${response.id}`);
        await storage.markPendingResponseProcessed(response.id);
        return;
      }

      const aiResponse = await generateAIResponse(post.content, follower.personality);

      // Only create interaction if confidence is high enough
      if (aiResponse.confidence > 0.7) {
        await storage.createAiInteraction({
          postId: post.id,
          aiFollowerId: follower.id,
          userId: null,
          type: aiResponse.type,
          content: aiResponse.content || null,
          parentId: null,
        });

        console.log(`[ResponseScheduler] Created response for follower ${follower.id} on post ${post.id}`);
      } else {
        console.log(`[ResponseScheduler] Skipped low-confidence response from ${follower.id} for post ${post.id}`);
      }

      await storage.markPendingResponseProcessed(response.id);
    } catch (error) {
      console.error(`[ResponseScheduler] Error processing response ${response.id}:`, error);
    }
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[ResponseScheduler] Stopped response scheduler");
    }
  }
}