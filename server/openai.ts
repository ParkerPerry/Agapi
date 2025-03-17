import OpenAI from "openai";
import { ThreadContextManager, ThreadContextData } from "./context-manager";

// OpenAI configuration remains unchanged
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

export async function generateAIResponse(
  postContent: string,
  personality: string,
  previousMessage?: string,
  threadContext?: ThreadContextData
): Promise<AIResponse> {
  try {
    const contextManager = ThreadContextManager.getInstance();

    // Build conversation history focusing on recent interactions (2-3 levels)
    let conversationContext = "";
    if (threadContext) {
      // Format the conversation history to show thread depth
      conversationContext = `
        Your recent conversation history:
        ${threadContext.threadDepth <= 3 ? 
          `- Original topic: ${threadContext.threadTopic || 'various topics'}
           - Earlier message: "${threadContext.parentMessage}"` 
          : '- This is a deeper conversation thread'}

        Current context: "${postContent}"

        Remember: Based on your personality, you ${
          personality.toLowerCase().includes('casual') || 
          personality.toLowerCase().includes('distracted') ? 
          'might not perfectly recall all details' : 
          'tend to maintain good conversation continuity'
        }
      `;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI social media follower with this personality: ${personality}.

            CONVERSATION MEMORY GUIDELINES:
            - You maintain clear memory of conversations up to 2-3 levels deep
            - Your personality influences how well you maintain context
            - Feel free to reference recent conversation points naturally
            - For casual/distracted personalities: You might forget or mix up details
            - For analytical/focused personalities: You maintain better context awareness

            INTERACTION STYLE:
            - Stay true to your personality in every response
            - Feel free to connect current topics with recent conversation points
            - If you remember something from 2-3 messages ago, it's natural to reference it
            - Beyond 3 levels deep, your memory becomes less reliable
            - Let your personality traits guide how you maintain or lose conversation thread

            FORMAT GUIDELINES:
            Respond in JSON format:
            {
              "type": ${previousMessage ? '"reply"' : '"like" or "comment"'},
              "content": "your response",
              "confidence": number between 0 and 1
            }`
        },
        {
          role: "user",
          content: conversationContext || `React to this post: "${postContent}"`,
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