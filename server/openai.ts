import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AIResponse {
  type: "like" | "comment" | "reply";
  content?: string;
  confidence: number;
}

interface AIBackground {
  background: string;
  interests: string[];
  communication_style: string;
  interaction_preferences: {
    likes: string[];
    dislikes: string[];
  };
}

export async function generateAIBackground(
  name: string,
  personality: string,
): Promise<AIBackground> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a creative character developer. Your task is to create a detailed background for an AI social-media follower, responding in JSON format with the following structure:
            {
              "background": "A brief but engaging backstory",
              "interests": ["List of 3-5 specific interests"],
              "communication_style": "Description of how they communicate",
              "interaction_preferences": {
                "likes": ["3-4 specific things they tend to like in posts"],
                "dislikes": ["2-3 things they tend to dislike or avoid"]
              }
            }
            The JSON response should be consistent with the follower's name and personality description.`,
        },
        {
          role: "user",
          content: `Please generate a JSON background for an AI follower named "${name}" with this personality: "${personality}"`,
        },
      ],
      response_format: { type: "json_object" },
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content in response");
    }

    return JSON.parse(response.choices[0].message.content);
  } catch (error: any) {
    throw new Error("Failed to generate AI background: " + error.message);
  }
}

interface ThreadContext {
  parentMessage?: string;
  parentAuthor?: string;
  threadTopic?: string;
  immediateContext: string;
  threadDepth: number;
}

// Helper to determine if follower should maintain context based on personality
function shouldMaintainContext(personality: string, threadDepth: number): boolean {
  // Extract personality traits that might affect context maintenance
  const attentiveTraits = ['detail-oriented', 'analytical', 'focused', 'professional', 'expert', 'academic'];
  const casualTraits = ['casual', 'laid-back', 'playful', 'distracted', 'chaotic', 'random'];

  // Calculate base chance of maintaining context
  let contextChance = 0.7; // 70% base chance

  // Adjust based on personality traits
  const lowerPersonality = personality.toLowerCase();
  attentiveTraits.forEach(trait => {
    if (lowerPersonality.includes(trait)) contextChance += 0.1;
  });
  casualTraits.forEach(trait => {
    if (lowerPersonality.includes(trait)) contextChance -= 0.1;
  });

  // Decrease chance as thread depth increases
  contextChance -= (threadDepth - 1) * 0.2;

  // Add some randomness
  const random = Math.random();
  return random < Math.max(0.1, Math.min(0.9, contextChance));
}

export async function generateAIResponse(
  postContent: string,
  personality: string,
  previousMessage?: string,
  threadContext?: ThreadContext
): Promise<AIResponse> {
  try {
    // Determine if the AI should maintain context based on personality and thread depth
    const maintainContext = threadContext && shouldMaintainContext(personality, threadContext.threadDepth);

    // Construct a more natural, personality-driven context prompt
    const contextPrompt = maintainContext
      ? `You're in a conversation where someone earlier mentioned something about "${threadContext.parentMessage}". 
         Now someone is saying: "${postContent}"`
      : previousMessage 
        ? `Responding to: "${postContent}"`
        : `Check out this post: ${postContent}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI follower with this personality: ${personality}.
            Key guidelines:
            - Be natural and spontaneous in your responses
            - Sometimes reference earlier context, sometimes don't - be human-like
            - Stay true to your personality regardless of conversation
            - Keep responses casual and conversational
            ${maintainContext ? "- You might want to reference the earlier context if it feels natural" : ""}

            Format response as JSON:
            {
              "type": ${previousMessage ? '"reply"' : '"like" or "comment"'},
              "content": "your response",
              "confidence": number between 0 and 1
            }`
        },
        {
          role: "user",
          content: contextPrompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content in response");
    }

    const result = JSON.parse(response.choices[0].message.content);
    return {
      type: previousMessage ? "reply" : result.type,
      content: result.content,
      confidence: Math.max(0, Math.min(1, result.confidence)),
    };
  } catch (error: any) {
    throw new Error("Failed to generate AI response: " + error.message);
  }
}