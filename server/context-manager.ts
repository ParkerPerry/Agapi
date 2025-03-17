import { AiFollower, AiInteraction } from "@shared/schema";

export interface ThreadContextData {
  parentMessage?: string;
  parentAuthor?: string;
  threadTopic?: string;
  immediateContext: string;
  threadDepth: number;
  relevanceScore?: number;
}

export class ThreadContextManager {
  private static instance: ThreadContextManager;

  // Personality traits that affect context maintenance
  private readonly attentiveTraits = [
    'detail-oriented', 'analytical', 'focused', 
    'professional', 'expert', 'academic'
  ];

  private readonly casualTraits = [
    'casual', 'laid-back', 'playful', 
    'distracted', 'chaotic', 'random'
  ];

  private constructor() {}

  public static getInstance(): ThreadContextManager {
    if (!ThreadContextManager.instance) {
      ThreadContextManager.instance = new ThreadContextManager();
    }
    return ThreadContextManager.instance;
  }

  /**
   * Calculate thread depth and build context data
   */
  public async buildThreadContext(
    currentInteraction: AiInteraction,
    parentInteraction: AiInteraction,
    aiFollower: AiFollower
  ): Promise<ThreadContextData> {
    const threadDepth = await this.calculateThreadDepth(parentInteraction);

    return {
      parentMessage: parentInteraction.content || undefined,
      parentAuthor: "User", // TODO: Enhance with actual username
      immediateContext: currentInteraction.content || "",
      threadDepth,
      relevanceScore: this.calculateRelevanceScore(
        currentInteraction.content || "",
        parentInteraction.content || "",
        threadDepth
      )
    };
  }

  /**
   * Determine if the AI follower should maintain context based on personality and relevance
   */
  public shouldMaintainContext(
    personality: string,
    threadDepth: number,
    relevanceScore?: number
  ): boolean {
    // Base chance of maintaining context
    let contextChance = 0.7;

    // Adjust based on personality traits
    const lowerPersonality = personality.toLowerCase();

    this.attentiveTraits.forEach(trait => {
      if (lowerPersonality.includes(trait)) contextChance += 0.1;
    });

    this.casualTraits.forEach(trait => {
      if (lowerPersonality.includes(trait)) contextChance -= 0.1;
    });

    // Decrease chance as thread depth increases
    contextChance -= (threadDepth - 1) * 0.2;

    // Adjust based on relevance score if available
    if (relevanceScore !== undefined) {
      contextChance *= relevanceScore;
    }

    // Add some randomness while keeping within reasonable bounds
    const random = Math.random();
    return random < Math.max(0.1, Math.min(0.9, contextChance));
  }

  /**
   * Calculate thread depth from parent interaction
   */
  private async calculateThreadDepth(
    interaction: AiInteraction,
    depth: number = 1
  ): Promise<number> {
    if (!interaction.parentId) {
      return depth;
    }

    // TODO: Implement storage.getInteraction once moved
    // const parent = await storage.getInteraction(interaction.parentId);
    // if (parent) {
    //   return this.calculateThreadDepth(parent, depth + 1);
    // }

    return depth;
  }

  /**
   * Calculate relevance score between current and parent message
   */
  private calculateRelevanceScore(
    currentMessage: string,
    parentMessage: string,
    threadDepth: number
  ): number {
    // Simple word overlap scoring for now
    const currentWords = new Set(currentMessage.toLowerCase().split(/\s+/));
    const parentWords = new Set(parentMessage.toLowerCase().split(/\s+/));

    const intersection = new Set(
      [...currentWords].filter(word => parentWords.has(word))
    );

    const overlapScore = intersection.size / 
      Math.max(currentWords.size, parentWords.size);

    // Decay score with thread depth
    return overlapScore * Math.pow(0.8, threadDepth - 1);
  }

  /**
   * Generate context-aware prompt based on thread context
   */
  public generateContextPrompt(
    postContent: string,
    threadContext?: ThreadContextData,
    previousMessage?: string
  ): string {
    if (!threadContext) {
      return `Check out this post: ${postContent}`;
    }

    if (threadContext.relevanceScore && threadContext.relevanceScore > 0.3) {
      return `You're in a conversation where someone earlier mentioned something about "${threadContext.parentMessage}". 
              Now someone is saying: "${postContent}"`;
    }

    return previousMessage
      ? `Responding to: "${postContent}"`
      : `Check out this post: ${postContent}`;
  }
}