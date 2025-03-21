import { storage } from "./storage";
import { generateAIResponse } from "./openai";
import { PendingResponse, AiFollower } from "@shared/schema";
import { ThreadContextData } from "./context-manager";
import OpenAI from "openai";
import { processTextWithTools } from "./tools";

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
   * Calculate the relevance score between content and an AI follower
   * @param postContent The original post content
   * @param follower The AI follower to evaluate relevance for
   * @param threadContext Optional thread context data for thread replies
   * @returns A relevance score between 0 and 1
   */
  private async calculateRelevanceScore(
    postContent: string, 
    follower: AiFollower, 
    threadContext?: ThreadContextData
  ): Promise<number> {
    try {
      // Determine if we're dealing with a thread reply or direct post
      const isThreadReply = !!threadContext;
      
      // For thread replies, aggregate recent messages to create a richer context
      let contentToAnalyze = postContent;
      
      if (isThreadReply) {
        // Log that we're using enhanced thread context
        console.log("[ResponseScheduler] Using thread context for relevance calculation:", {
          followerId: follower.id,
          followerName: follower.name,
          threadDepth: threadContext.threadDepth || 0
        });

        // Aggregate content from recent messages in the thread with most recent first
        // Weight more recent messages higher in the analysis
        const contextMessages = [];
        
        // Add the immediate context (most recent message)
        if (threadContext.immediateContext) {
          contextMessages.push(`Most recent message: "${threadContext.immediateContext}"`);
        }
        
        // Add parent message (previous message)
        if (threadContext.parentMessage) {
          contextMessages.push(`Previous message: "${threadContext.parentMessage}"`);
        }
        
        // Add original thread topic if available
        if (threadContext.threadTopic) {
          contextMessages.push(`Original thread topic: "${threadContext.threadTopic}"`);
        }
        
        // Create an enhanced context combining recent messages with original post
        contentToAnalyze = `
          Thread context:
          ${contextMessages.join("\n")}
          
          Original post:
          "${postContent}"
        `;
      }
      
      console.log("[ResponseScheduler] Starting relevance calculation for:", {
        followerId: follower.id,
        followerName: follower.name,
        isThreadReply,
        contentPreview: isThreadReply 
          ? "Using aggregated thread context" 
          : postContent.substring(0, 100)
      });

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Build a comprehensive prompt that compares the content with follower's profile
      const systemPrompt = `You are an AI that analyzes content relevance. 
        Your task is to determine how relevant ${isThreadReply ? 'a conversation thread' : 'a social media post'} is to a specific follower's profile.
        You must return a high relevance score (0.8-1.0) if the content strongly matches the follower's expertise.

        Follower Profile:
        - Interests: ${follower.interests?.join(', ') || 'None specified'}
        - Personality: ${follower.personality}
        - Communication style: ${follower.communicationStyle || 'Not specified'}
        - Likes: ${follower.interactionPreferences?.likes?.join(', ') || 'None specified'}
        - Dislikes: ${follower.interactionPreferences?.dislikes?.join(', ') || 'None specified'}

        Analyze the ${isThreadReply ? 'conversation thread' : 'post content'} and calculate a relevance score based on:
        1. Topic alignment with interests (50% weight)
        2. Emotional/personality match (25% weight)
        3. Communication style compatibility (25% weight)
        ${isThreadReply ? '4. For thread replies, prioritize the most recent messages over the original post (weighted recency)' : ''}

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
            ${isThreadReply ? ',"threadContextRelevance": string explaining how relevant the recent messages are compared to the original post' : ''}
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
            content: `Analyze this ${isThreadReply ? 'conversation thread' : 'post content'}: ${contentToAnalyze}`
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
        isThreadReply,
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
          isThreadReply: !!threadContext
        });
      }
      return 0.5; // Default to neutral on error
    }
  }

  public async scheduleResponse(postId: number, follower: AiFollower & { muted?: boolean }): Promise<void> {
    try {
      console.log(`[ResponseScheduler] Starting response scheduling for post ${postId} and follower ${follower.id}`);

      // First, check if this follower is inactive globally
      if (!follower.active) {
        console.log(`[ResponseScheduler] Follower ${follower.id} (${follower.name}) is globally inactive and will be skipped`);
        return;
      }

      // Check if this follower is muted in this circle
      if (follower.muted) {
        console.log(`[ResponseScheduler] Follower ${follower.id} (${follower.name}) is muted in this circle and will be skipped`);
        return;
      }

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
      const finalChance = Math.min(adjustedChance, 100);

      // Log the decision making process
      console.log(`[ResponseScheduler] Response probability calculation:`, {
        followerId: follower.id,
        followerName: follower.name,
        baseChance,
        relevanceScore,
        finalChance,
        expertise: follower.interests,
        personality: follower.personality
      });

      // Generate random number once and store it
      const randomValue = Math.random() * 100;

      // Debug log for the actual comparison
      console.log(`[ResponseScheduler] Random check:`, {
        followerId: follower.id,
        randomValue,
        finalChance,
        willRespond: randomValue <= finalChance
      });

      // Determine if follower will respond based on adjusted chance
      if (randomValue > finalChance) {
        console.log(`[ResponseScheduler] Follower ${follower.id} chose not to respond:`, {
          randomValue,
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
        metadata: null, // No thread context for top-level responses
      });

      console.log(`[ResponseScheduler] Successfully scheduled response:`, {
        followerId: follower.id,
        postId,
        scheduledTime,
        delay
      });
    } catch (error) {
      console.error(`[ResponseScheduler] Error scheduling response:`, error);
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

  /**
   * Schedule a thread response (reply to an existing interaction)
   * @param postId The post ID
   * @param follower The AI follower who will reply
   * @param parentId The parent interaction ID to reply to
   * @param contextMetadata JSON string with thread context information
   * @param isPrimaryTarget Whether this follower is the direct target of the reply (true) or just a potential participant (false)
   */
  public async scheduleThreadResponse(
    postId: number, 
    follower: AiFollower, 
    parentId: number, 
    contextMetadata: string,
    isPrimaryTarget: boolean = true
  ): Promise<void> {
    try {
      console.log(`[ResponseScheduler] Starting thread response scheduling for post ${postId}, parent ${parentId}, follower ${follower.id}`);

      // Get post content for relevance analysis
      const post = await storage.getPost(postId);
      if (!post) {
        console.error(`[ResponseScheduler] Post ${postId} not found for thread reply`);
        return;
      }

      // Parse the thread context from metadata
      let threadContext: ThreadContextData | undefined;
      try {
        const metadata = JSON.parse(contextMetadata);
        threadContext = metadata.threadContext;
        
        if (!threadContext) {
          console.warn(`[ResponseScheduler] No thread context found in metadata for follower ${follower.id}`);
        } else {
          console.log(`[ResponseScheduler] Retrieved thread context for follower ${follower.id}:`, {
            threadDepth: threadContext.threadDepth,
            hasParentMessage: !!threadContext.parentMessage,
            hasImmediateContext: !!threadContext.immediateContext
          });
        }
      } catch (error) {
        console.error(`[ResponseScheduler] Error parsing thread context:`, error);
      }

      // For thread replies, we adjust the probability based on whether this is the primary target
      let finalChance: number;
      
      if (isPrimaryTarget) {
        // Higher chance (80-90%) for the AI being directly replied to - more natural conversation flow
        finalChance = Math.min(80 + (Math.random() * 10), 100);
        console.log(`[ResponseScheduler] Primary target follower ${follower.id} has ${finalChance}% chance to respond to direct reply`);
      } else {
        // For other circle followers who weren't directly addressed, use the enhanced relevance calculation
        // that includes thread context to determine if they should join the conversation
        const relevanceScore = await this.calculateRelevanceScore(post.content, follower, threadContext);
        
        // Log the relevance score with thread context
        console.log(`[ResponseScheduler] Thread context relevance for follower ${follower.id}: ${relevanceScore}`);
        
        // Adjust chance of responding based on relevance to the thread context
        const baseChance = 20; // Lower base chance (20%) for thread participation
        const relevanceMultiplier = 2.5; // Slightly higher multiplier for thread context relevance
        finalChance = Math.min(baseChance * (relevanceScore * relevanceMultiplier), 60); // Cap at 60%
        
        console.log(`[ResponseScheduler] Secondary follower ${follower.id} has ${finalChance}% chance to join thread based on context relevance`);
      }

      // Determine if follower will respond
      const randomValue = Math.random() * 100;
      if (randomValue > finalChance) {
        console.log(`[ResponseScheduler] Follower ${follower.id} chose not to respond to thread:`, {
          randomValue,
          requiredChance: finalChance,
          isPrimaryTarget
        });
        return;
      }

      // Calculate delay based on follower's responsiveness, but shorter for thread replies
      // Thread replies should generally be faster than top-level comments
      let delay = this.calculateDelay(follower);
      
      // If this is the primary target (the AI being directly replied to), make response faster
      if (isPrimaryTarget) {
        delay = Math.max(1, Math.floor(delay * 0.5)); // At least 1 minute, but otherwise halve the delay
      }
      
      const scheduledTime = new Date(Date.now() + delay * 60 * 1000); // Convert minutes to milliseconds

      // Parse existing metadata to include isPrimaryTarget flag
      let updatedMetadata;
      try {
        const parsedMetadata = JSON.parse(contextMetadata);
        
        // Add isPrimaryTarget flag to metadata
        updatedMetadata = JSON.stringify({
          ...parsedMetadata,
          isPrimaryTarget
        });
      } catch (error) {
        console.error("[ResponseScheduler] Error parsing metadata to add isPrimaryTarget flag:", error);
        updatedMetadata = contextMetadata; // Fallback to original metadata
      }
      
      // Store the thread-specific metadata in the metadata field
      await storage.createPendingResponse({
        postId,
        aiFollowerId: follower.id,
        scheduledFor: scheduledTime,
        processed: false,
        metadata: updatedMetadata
      });

      console.log(`[ResponseScheduler] Successfully scheduled thread response:`, {
        followerId: follower.id,
        postId,
        parentId,
        scheduledTime,
        delay,
        isPrimaryTarget,
        hasThreadContext: !!threadContext
      });
    } catch (error) {
      console.error(`[ResponseScheduler] Error scheduling thread response:`, error);
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

  private async processResponse(response: PendingResponse): Promise<void> {
    try {
      // Use non-null assertion since postId and aiFollowerId are required fields
      const post = await storage.getPost(response.postId!);
      const follower = await storage.getAiFollower(response.aiFollowerId!);

      if (!post || !follower) {
        console.error(`[ResponseScheduler] Missing post or follower for response ${response.id}`);
        await storage.markPendingResponseProcessed(response.id);
        return;
      }

      // Check if this is a thread response by examining metadata
      let parentId: number | null = null;
      let threadContext: ThreadContextData | undefined;
      
      if (response.metadata) {
        try {
          const metadata = JSON.parse(response.metadata);
          parentId = metadata.parentInteractionId || metadata.parentId || null;
          threadContext = metadata.threadContext;
          
          console.log(`[ResponseScheduler] Processing thread response:`, {
            responseId: response.id,
            parentId,
            hasThreadContext: !!threadContext,
            threadDepth: threadContext?.threadDepth || 0
          });
          
          // If we have thread context, do a final context relevance check before generating a response
          if (threadContext && !metadata.isPrimaryTarget) {
            // For secondary participants (not the main target of the reply), do one final
            // relevance check to ensure the thread is still relevant to this follower
            const contextRelevanceScore = await this.calculateRelevanceScore(
              post.content, 
              follower, 
              threadContext
            );
            
            // Log the context relevance score for debugging
            console.log(`[ResponseScheduler] Final thread context relevance for ${follower.name}: ${contextRelevanceScore}`);
            
            // Skip if the relevance is too low - this provides a final check before spending tokens on a response
            if (contextRelevanceScore < 0.3) {
              console.log(`[ResponseScheduler] Skipping response generation due to low context relevance: ${contextRelevanceScore}`);
              await storage.markPendingResponseProcessed(response.id);
              return;
            }
          }
        } catch (error) {
          console.error(`[ResponseScheduler] Error parsing response metadata:`, error);
        }
      }

      // Generate appropriate response depending on whether this is a thread reply or top-level comment
      let aiResponse;
      
      // Explicitly check parentId as number since it could be null from the database schema
      if (parentId !== null) {
        // For thread replies, use the parent content as context
        const parentInteraction = await storage.getInteraction(parentId);
        if (!parentInteraction) {
          console.error(`[ResponseScheduler] Parent interaction ${parentId} not found`);
          await storage.markPendingResponseProcessed(response.id);
          return;
        }
        
        // Gather any previous interactions in the thread to provide richer context
        // This additional context helps AI followers maintain more coherent thread responses
        let previousMessages = [];
        if (threadContext && threadContext.threadDepth > 1) {
          // Try to fetch a couple of previous messages in the thread
          const interactions = await storage.getPostInteractions(post.id);
          
          // Build a simple message history for this thread if available
          if (interactions && interactions.length > 0) {
            // Explicitly define currentId as number | null type to match schema
            let currentId: number | null = parentId;
            let depth = 0;
            const maxDepth = 3; // Limit to 3 previous messages to keep context manageable
            
            // Follow the parent chain up to get previous messages
            while (currentId !== null && depth < maxDepth) {
              const interaction = interactions.find(i => i.id === currentId);
              if (!interaction) break;
              
              // Add this message to our history
              const author = interaction.aiFollowerId 
                ? (await storage.getAiFollower(interaction.aiFollowerId))?.name || "AI" 
                : "User";
                
              previousMessages.unshift(`${author}: ${interaction.content || ""}`);
              
              // Move to parent of this message (safely handle undefined or null)
              currentId = interaction.parentId || null;
              depth++;
            }
            
            console.log(`[ResponseScheduler] Built thread history with ${previousMessages.length} previous messages`);
          }
        }
        
        // Generate response with enhanced thread context
        aiResponse = await generateAIResponse(
          post.content,
          follower.personality,
          parentInteraction.content || undefined,
          threadContext,
          // Pass the gathered previous messages if available
          previousMessages.length > 0 ? previousMessages.join("\n") : undefined,
          follower // Pass the follower for tool integration
        );
      } else {
        // For top-level comments, use the post content directly
        aiResponse = await generateAIResponse(
          post.content, 
          follower.personality,
          undefined,
          undefined,
          undefined,
          follower // Pass the follower for tool integration
        );
      }

      // Only create interaction if confidence is high enough
      if (aiResponse.confidence > 0.7) {
        // Process the content using any tools the follower has equipped
        let processedContent = aiResponse.content || null;
        let toolsUsed = null;
        
        if (processedContent && follower.tools && follower.tools.equipped && follower.tools.equipped.length > 0) {
          try {
            // Process the content with the follower's tools and track tool usage
            const processResult = processTextWithTools(processedContent, follower);
            processedContent = processResult.processedText;
            toolsUsed = processResult.toolsUsed;
            
            console.log(`[ResponseScheduler] Processed content with AI tools for follower ${follower.id}`, 
              toolsUsed.used ? `- Tools used: ${toolsUsed.tools.map(t => t.name).join(', ')}` : '- No tools used');
          } catch (error) {
            console.error(`[ResponseScheduler] Error processing content with tools:`, error);
            // Continue with original content in case of error
          }
        }
        
        await storage.createAiInteraction({
          postId: post.id,
          aiFollowerId: follower.id,
          userId: null,
          type: parentId !== null ? "reply" : aiResponse.type, // Force "reply" type for thread responses
          content: processedContent,
          parentId: parentId, // Use parentId for thread replies, null for top-level
          toolsUsed: toolsUsed, // Store tool usage information
        });

        console.log(`[ResponseScheduler] Created ${parentId !== null ? 'thread reply' : 'comment'} for follower ${follower.id} on post ${post.id}`);
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