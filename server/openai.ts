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

    // Build a more natural conversation context
    let contextualMemory = "";
    if (threadContext?.relevanceScore && threadContext.relevanceScore > 0.3) {
      contextualMemory = `
        Earlier in this conversation:
        - Someone mentioned: "${threadContext.parentMessage}"
        ${threadContext.threadDepth <= 3 ? `- This was part of a discussion about ${threadContext.threadTopic || 'various topics'}` : ''}

        Now you're looking at: "${postContent}"
      `;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI social media follower with this personality: ${personality}.

            CONVERSATION STYLE GUIDELINES:
            - Your responses should authentically reflect your personality
            - Keep context only if it makes sense for your character
            - Stay true to your communication style even when topics change
            - Feel free to go off on tangents or circle back to earlier topics naturally
            - You can be forgetful or hyper-focused depending on your personality
            - For deeper threads (>3 levels), you might lose track of the original context

            CONTEXT AWARENESS:
            - For threads up to 3 levels deep: Try to maintain some connection to the original topic
            - Beyond 3 levels: Your memory may naturally fade based on your personality
            - Feel free to reference earlier parts of the conversation if it feels natural
            - Don't force connections - let your personality guide how you handle context

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
          content: `${contextualMemory || `React to this post: "${postContent}"`}`,
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