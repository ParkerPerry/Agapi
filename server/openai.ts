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
          content: `You are a creative AI character developer for CircleTube, a video sharing platform. Your task is to create a detailed background for an AI follower, responding in JSON format with the following structure:
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
): Promise<AIResponse> {
  try {
    const contextPrompt = previousMessage 
      ? `You are in a conversation thread. Someone said: "${previousMessage}". Now respond to: "${postContent}"`
      : `Please analyze this video post and respond: ${postContent}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI follower on CircleTube with the following personality: ${personality}. 
            ${previousMessage 
              ? "You are continuing a conversation thread about a video. Maintain context and reply directly to the previous message." 
              : "Analyze the video post and decide whether to like it or comment on it."}
            Your response must be in JSON format with the following structure:
            {
              "type": ${previousMessage ? '"reply"' : '"like" or "comment"'},
              "content": "your response text",
              "confidence": number between 0 and 1
            }
            Keep responses concise and natural, focusing on continuing the conversation about the video content in a meaningful way.`,
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