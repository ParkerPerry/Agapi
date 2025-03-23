import { AiFollower } from "@shared/schema";
import { storage } from "./storage";
import { generateAIBackground } from "./openai";

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
  // Validate and retrieve the template follower
  const templateFollower = await storage.getAiFollower(request.templateFollowerId);
  if (!templateFollower) {
    throw new Error("Template follower not found");
  }

  if (request.cloneCount < 1 || request.cloneCount > 20) {
    throw new Error("Clone count must be between 1 and 20");
  }

  // Create a new collective to group the clones
  const collective = await storage.createAiFollowerCollective(userId, {
    name: request.collectiveName,
    description: request.description || `Collection of variations based on ${templateFollower.name}`,
  });

  // Generate specified number of variations
  const followers: AiFollower[] = [];
  const variationPromises = [];

  for (let i = 0; i < request.cloneCount; i++) {
    variationPromises.push(
      generateFollowerVariation(
        templateFollower,
        userId,
        i + 1,
        request.variationLevel,
        request.customInstructions
      ).then(async (follower) => {
        // Add the new follower to the collective
        await storage.addFollowerToCollective(collective.id, follower.id);
        followers.push(follower);
      })
    );
  }

  // Wait for all variations to be created
  await Promise.all(variationPromises);

  return {
    collectiveId: collective.id,
    followers,
  };
}

/**
 * Generate a variation of the template follower based on the given variation level
 */
async function generateFollowerVariation(
  template: AiFollower,
  userId: number,
  index: number,
  variationLevel: number,
  customInstructions?: string
): Promise<AiFollower> {
  // Determine variation level descriptions
  let variationDescription: string;
  
  if (variationLevel < 0.3) {
    variationDescription = `Create a subtle variation of this character that maintains most of the original personality but with minor differences. Keep core traits and values similar.`;
  } else if (variationLevel < 0.7) {
    variationDescription = `Create a moderate variation of this character with some distinct personality traits while preserving the essence of the original. Feel free to modify communication style and some interests.`;
  } else {
    variationDescription = `Create a significant variation of this character that's clearly distinct but inspired by the original. Feel free to reimagine many aspects while keeping a thematic connection to the source.`;
  }

  // Combine variation description with any custom instructions
  const fullInstructions = [
    variationDescription,
    customInstructions || "",
    `This is variation #${index} in a series.`
  ].filter(Boolean).join(" ");

  // Create a variation of the name
  const nameSuffix = index.toString().padStart(2, '0');
  const newName = `${template.name} v${nameSuffix}`;

  // Generate a variation of the personality
  const personalityVariation = adjustPersonalityByVariationLevel(
    template.personality,
    variationLevel
  );

  // Use OpenAI to generate a new background with the instructions for variation
  const aiBackground = await generateAIBackground(
    newName,
    personalityVariation,
    fullInstructions
  );

  // Create the new follower with variations
  const newFollower = await storage.createAiFollower(userId, {
    name: newName,
    personality: personalityVariation,
    avatarUrl: template.avatarUrl,
    background: aiBackground.background,
    interests: aiBackground.interests,
    communicationStyle: aiBackground.communication_style,
    interactionPreferences: {
      likes: aiBackground.interaction_preferences.likes,
      dislikes: aiBackground.interaction_preferences.dislikes,
    },
    active: true,
    responsiveness: template.responsiveness,
    responseDelay: template.responseDelay,
    responseChance: template.responseChance,
    tools: template.tools,
  });

  return newFollower;
}

/**
 * Adjust the personality description based on the variation level
 */
function adjustPersonalityByVariationLevel(
  originalPersonality: string,
  variationLevel: number
): string {
  // For very low variation, just return the original
  if (variationLevel < 0.2) {
    return originalPersonality;
  }

  // For medium variation, add some modifiers to the personality
  if (variationLevel < 0.6) {
    const modifiers = [
      "slightly more outgoing",
      "somewhat more analytical",
      "a bit more creative",
      "slightly more reserved",
      "somewhat more enthusiastic",
      "a bit more cautious",
      "slightly more philosophical",
      "somewhat more practical",
      "a bit more empathetic",
      "slightly more logical"
    ];
    
    // Select a random modifier
    const randomModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    return `${originalPersonality}, but ${randomModifier}`;
  }

  // For high variation, make more substantial changes
  // We'll keep the core personality but add significant variations
  const majorVariations = [
    "with a strong contrasting tendency toward creativity and spontaneity",
    "but with a much more analytical and detail-oriented approach to topics",
    "though with a distinctly different communication style that's more direct and concise",
    "yet with a significantly more philosophical outlook on topics being discussed",
    "however with a notably more humor-oriented approach to conversations",
    "though focusing much more on practical applications rather than theoretical concepts",
    "but with a dramatically more empathetic approach to understanding others",
    "with a distinctly more skeptical perspective on common assumptions",
    "but reimagined with a stronger focus on long-term thinking and future implications",
    "though with a notably different set of ethical priorities and considerations"
  ];
  
  // Select a random major variation
  const randomMajorVariation = majorVariations[Math.floor(Math.random() * majorVariations.length)];
  return `${originalPersonality}, ${randomMajorVariation}`;
}