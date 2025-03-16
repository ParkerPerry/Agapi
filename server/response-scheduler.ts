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

  /**
   * Calculate how relevant a post is to an AI follower's interests
   */
  private async calculateRelevanceScore(postContent: string, follower: AiFollower): Promise<number> {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI that analyzes content relevance. The response must be a number between 0 and 1.
              Consider these factors:
              - User interests: ${follower.interests?.join(', ')}
              - Likes: ${follower.interactionPreferences?.likes?.join(', ')}
              - Dislikes: ${follower.interactionPreferences?.dislikes?.join(', ')}

              Return a JSON object with format: {"relevance": number}
              Where:
              0 = Completely irrelevant/disliked
              1 = Highly relevant/liked

              Base the score on how well the content matches the interests and preferences.`
          },
          {
            role: "user",
            content: `Analyze this content: "${postContent}"`
          }
        ],
        response_format: { type: "json_object" }
      });

      if (!response.choices[0].message.content) {
        return 0.5; // Default to neutral if no response
      }

      const result = JSON.parse(response.choices[0].message.content);
      return result.relevance;
    } catch (error) {
      console.error("[ResponseScheduler] Error calculating relevance:", error);
      return 0.5; // Default to neutral on error
    }
  }

  /**
   * Schedule a potential response from an AI follower
   */
  public async scheduleResponse(postId: number, follower: AiFollower): Promise<void> {
    try {
      // Get post content for relevance analysis
      const post = await storage.getPost(postId);
      if (!post) {
        console.error(`[ResponseScheduler] Post ${postId} not found`);
        return;
      }

      // Calculate content relevance
      const relevanceScore = await this.calculateRelevanceScore(post.content, follower);
      console.log(`[ResponseScheduler] Post ${postId} relevance for follower ${follower.id}: ${relevanceScore}`);

      // Combine base response chance with relevance score
      // High relevance can increase chance, low relevance decreases it
      const adjustedChance = follower.responseChance * relevanceScore;

      // Determine if follower will respond based on adjusted chance
      if (Math.random() * 100 > adjustedChance) {
        console.log(`[ResponseScheduler] Follower ${follower.id} chose not to respond to post ${postId} (relevance: ${relevanceScore}, chance: ${adjustedChance}%)`);
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

      console.log(`[ResponseScheduler] Scheduled response for follower ${follower.id} at ${scheduledTime}`);
    } catch (error) {
      console.error(`[ResponseScheduler] Error scheduling response:`, error);
    }
  }

  private calculateDelay(follower: AiFollower): number {
    const { min, max } = follower.responseDelay;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Start the scheduler that processes pending responses
   */
  public start(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      try {
        const pendingResponses = await storage.getPendingResponses();

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
        return;
      }

      const aiResponse = await generateAIResponse(post.content, follower.personality);

      if (aiResponse.confidence > 0.7) {
        await storage.createAiInteraction({
          postId: post.id,
          aiFollowerId: follower.id,
          userId: null,
          type: aiResponse.type,
          content: aiResponse.content || null,
          parentId: null,
        });

        console.log(`[ResponseScheduler] Created delayed response for follower ${follower.id} on post ${post.id}`);
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