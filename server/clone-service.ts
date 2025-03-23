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
  namingOption: 'dynamic' | 'sequential'; // 'dynamic' = LLM generated, 'sequential' = numbers
  generateDynamicAvatars: boolean; // Whether to generate new avatars for dynamic names
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

  // Set defaults for optional parameters
  const namingOption = request.namingOption || 'sequential';
  const generateDynamicAvatars = request.generateDynamicAvatars || false;

  // Create a new collective to group the clones
  const collective = await storage.createAiFollowerCollective(userId, {
    name: request.collectiveName,
    personality: templateFollower.personality, // Required field
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
        request.customInstructions,
        namingOption,
        generateDynamicAvatars
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
  customInstructions?: string,
  namingOption: 'dynamic' | 'sequential' = 'sequential',
  generateDynamicAvatars: boolean = false
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

  // Add naming instruction for dynamic names
  let nameInstruction = "";
  if (namingOption === 'dynamic') {
    nameInstruction = `Also generate a unique character name that reflects this variation of ${template.name}. The name should be creative and distinct while maintaining some thematic connection to the original.`;
  }

  // Combine variation description with any custom instructions
  const fullInstructions = [
    variationDescription,
    nameInstruction,
    customInstructions || "",
    `This is variation #${index} in a series.`
  ].filter(Boolean).join(" ");

  // Generate a variation of the personality
  const personalityVariation = adjustPersonalityByVariationLevel(
    template.personality,
    variationLevel
  );

  // Determine name based on naming option
  let newName: string;
  
  if (namingOption === 'sequential') {
    // Sequential naming: just add a number suffix
    const nameSuffix = index.toString().padStart(2, '0');
    newName = `${template.name} ${nameSuffix}`;
  } else {
    // For dynamic naming, we'll temporarily use a placeholder that will be replaced by
    // the name generated in the AI background
    newName = `${template.name} Variation ${index}`;
  }

  // Use OpenAI to generate a new background with the instructions for variation
  const aiBackground = await generateAIBackground(
    newName,
    personalityVariation,
    fullInstructions
  );

  // If using dynamic naming, extract the name from the background
  // Format: "Name: [character name]" or similar
  if (namingOption === 'dynamic' && aiBackground.background.includes("Name:")) {
    // Try different regex patterns to extract the name
    let nameMatch = aiBackground.background.match(/Name:\s*([^\n\.]+)/i);
    
    // If first pattern doesn't work, try a more general one
    if (!nameMatch || !nameMatch[1]) {
      nameMatch = aiBackground.background.match(/Name:\s*([^\.]+)/i);
    }
    
    if (nameMatch && nameMatch[1]) {
      // Get the extracted name and clean it up
      newName = nameMatch[1].trim();
      
      // Clean up the background by removing the name line
      aiBackground.background = aiBackground.background
        .replace(/Name:\s*([^\n\.]+)(\n+|\.)/i, "") // Try removing with newlines
        .replace(/Name:\s*([^\.]+)/i, "") // Backup pattern
        .trim();
      
      console.log(`Generated dynamic name: ${newName} for variation of ${template.name}`);
    } else {
      console.log("Dynamic naming attempted but name couldn't be extracted from:", aiBackground.background.substring(0, 100) + "...");
    }
  }

  // Determine avatar URL - either use the template's avatar or generate a new one for dynamic naming
  let avatarUrl = template.avatarUrl;
  if (namingOption === 'dynamic' && generateDynamicAvatars) {
    // Check if the template is using DiceBear
    if (template.avatarUrl.includes('dicebear.com')) {
      // For DiceBear v9, update the URL format
      // Extract the style (collection) and seed from the current URL if possible
      const currentUrlMatch = template.avatarUrl.match(/\/([^\/]+)\/svg\?seed=([^&]+)/);
      const style = currentUrlMatch ? currentUrlMatch[1] : 'avataaars';
      
      // Generate a unique seed based on the follower's name and a random component
      const seed = encodeURIComponent(`${newName}-${Math.random().toString(36).substring(2, 8)}`);
      
      // Construct a new DiceBear v9 URL
      avatarUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
    } else {
      // For non-DiceBear URLs, use the original method
      const randomSeed = Math.random().toString(36).substring(7);
      avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${randomSeed}`;
    }
  }

  // Create the new follower with variations
  const newFollower = await storage.createAiFollower(userId, {
    name: newName,
    personality: personalityVariation,
    avatarUrl: avatarUrl,
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
    parentId: template.id, // Set the parent-child relationship
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