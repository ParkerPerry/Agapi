import { storage } from "./storage";
import { generateAIResponse } from "./openai";
import { PendingResponse, AiFollower } from "@shared/schema";

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
   * Schedule a potential response from an AI follower
   */
  public async scheduleResponse(postId: number, follower: AiFollower): Promise<void> {
    // Determine if the follower will respond based on their responseChance
    if (Math.random() * 100 > follower.responseChance) {
      console.log(`[ResponseScheduler] Follower ${follower.id} chose not to respond to post ${postId}`);
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
