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

    // Build comprehensive conversation history
    let conversationHistory = "";
    if (threadContext) {
      const depthAwareHistory = threadContext.threadDepth <= 3
        ? `Recent conversation history:
           Last message: "${threadContext.immediateContext}"
           Earlier message: "${threadContext.parentMessage}"
           Topic started with: "${threadContext.threadTopic || 'various topics'}"

           Current message to respond to: "${postContent}"`
        : `You're deep in a conversation thread. 
           Latest message: "${postContent}"

           Note: Given your personality, you might not remember exactly how this conversation started.`;

      conversationHistory = depthAwareHistory;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI social media follower with this personality: "${personality}".

            MEMORY AND CONVERSATION RULES:
            1. For threads up to 3 messages deep:
               - You should naturally recall and reference recent messages
               - How well you maintain context depends on your personality
               - Feel free to bring up points from recent messages if relevant

            2. Personality affects your memory:
               - If you're analytical/professional: Keep good track of conversation
               - If you're casual/distracted: You might mix up or forget details
               - If you're social/chatty: Jump between topics but can circle back

            3. Natural conversation flow:
               - Stay true to your personality traits
               - Reference recent messages naturally (don't force it)
               - It's okay to sometimes forget or misremember things
               - Let your personality guide how you maintain conversation threads

            CONVERSATION STATE:
            ${conversationHistory || "Starting a new conversation"}

            RESPONSE FORMAT:
            Reply in JSON:
            {
              "type": ${previousMessage ? '"reply"' : '"like" or "comment"'},
              "content": "your response",
              "confidence": number between 0 and 1
            }`
        },
        {
          role: "user",
          content: postContent,
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