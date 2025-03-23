import { AiFollower } from "@shared/schema";
import { generateAIBackground } from "./openai";
import { storage } from "./storage";

interface CloneRequest {
  templateFollowerId: number;
  collectiveName: string;
  description: string;
  cloneCount: number;
  variationLevel: number;
  customInstructions: string;
}

interface CloneResponse {
  collectiveId: number;
  followers: AiFollower[];
}

/**
 * Clone Factory service that creates multiple AI followers based on a template
 * with controlled variations
 */
export async function cloneFollowers(userId: number, request: CloneRequest): Promise<CloneResponse> {
  try {
    console.log(`[CloneService] Starting clone process for template follower ID: ${request.templateFollowerId}`);
    
    // Get the template follower
    const templateFollower = await storage.getAiFollower(request.templateFollowerId);
    if (!templateFollower) {
      throw new Error(`Template follower with ID ${request.templateFollowerId} not found`);
    }
    
    // Create the AI follower collective
    const collective = await storage.createAiFollowerCollective(userId, {
      name: request.collectiveName,
      description: request.description || `Clones based on ${templateFollower.name}`,
      personality: templateFollower.personality,
      active: true, 
      createdAt: new Date(),
    });
    
    // Generate variations and create followers
    const followers: AiFollower[] = [];
    
    for (let i = 0; i < request.cloneCount; i++) {
      try {
        // Generate a variation of the template follower
        const variation = await generateFollowerVariation(
          templateFollower, 
          request.variationLevel,
          request.customInstructions,
          i + 1
        );
        
        // Create the follower
        const follower = await storage.createAiFollower(userId, variation);
        followers.push(follower);
        
        // Add to the collective
        await storage.addFollowerToCollective(collective.id, follower.id);
        
        console.log(`[CloneService] Created clone #${i+1}: ${follower.name} (ID: ${follower.id})`);
      } catch (err) {
        console.error(`[CloneService] Error creating clone #${i+1}:`, err);
      }
    }
    
    console.log(`[CloneService] Successfully created ${followers.length} clones`);
    
    return {
      collectiveId: collective.id,
      followers,
    };
  } catch (error) {
    console.error("[CloneService] Error cloning followers:", error);
    throw error;
  }
}

/**
 * Generate a variation of the template follower based on the given variation level
 */
async function generateFollowerVariation(
  template: AiFollower,
  variationLevel: number,
  customInstructions: string,
  cloneNumber: number
): Promise<Omit<AiFollower, "id" | "userId">> {
  try {
    // Base properties that don't change or have minimal changes
    const baseProperties = {
      active: true,
      responsiveness: template.responsiveness,
      tools: template.tools,
    };
    
    // Create a name variation
    const nameSuffix = cloneNumber > 1 ? ` ${String.fromCharCode(64 + cloneNumber)}` : "";
    const name = `${template.name}${nameSuffix}`;
    
    // For low variation level, keep most properties similar
    if (variationLevel < 0.3) {
      return {
        ...template,
        ...baseProperties,
        name,
        avatarUrl: template.avatarUrl, // Same avatar for similar clones
      };
    }
    
    // For medium variation, change some aspects but keep core personality
    if (variationLevel < 0.7) {
      // Get a slightly modified background
      const background = await generateAIBackground(
        name,
        template.personality,
        `Create a variation of this AI follower background. ${customInstructions} Keep similar personality traits but change some specific details.`
      );
      
      // Use template's response settings
      const responseDelay = template.responseDelay || { min: 5, max: 60 };
      
      return {
        ...template,
        ...baseProperties,
        name,
        background: background.background,
        communicationStyle: background.communication_style,
        interests: background.interests,
        interactionPreferences: {
          likes: background.interaction_preferences.likes,
          dislikes: background.interaction_preferences.dislikes,
        },
        responseDelay,
        responseChance: template.responseChance || 80
      };
    }
    
    // For high variation, significantly change the follower while keeping the template as inspiration
    const background = await generateAIBackground(
      name,
      template.personality,
      `Create a significant variation of this AI follower background. ${customInstructions} Use the original personality as inspiration but create a distinct follower with different traits and interests.`
    );
    
    // Calculate response delay based on template's responsiveness
    const responseDelay = template.responseDelay || { min: 5, max: 60 };
    
    return {
      ...baseProperties,
      name,
      personality: template.personality, // Keep the core personality to maintain some similarity
      avatarUrl: template.avatarUrl, // Can be updated to generate new avatars in the future
      background: background.background,
      communicationStyle: background.communication_style,
      interests: background.interests,
      interactionPreferences: {
        likes: background.interaction_preferences.likes,
        dislikes: background.interaction_preferences.dislikes,
      },
      responseDelay,
      responseChance: template.responseChance || 80,
    };
  } catch (error) {
    console.error("[CloneService] Error generating follower variation:", error);
    // Fallback to a basic variation if generation fails
    return {
      ...template,
      name: `${template.name} ${cloneNumber}`,
      active: true,
    };
  }
}