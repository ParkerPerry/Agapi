import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AIResponse {
  type: "like" | "comment";
  content?: string;
  confidence: number;
}

export async function generateAIResponse(
  postContent: string,
  personality: string,
): Promise<AIResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI follower with the following personality: ${personality}. 
            Analyze the post and decide whether to like it or comment on it.
            Respond with a JSON object containing:
            - type: "like" or "comment"
            - content: comment text if type is "comment"
            - confidence: number between 0 and 1 indicating how confident you are in this response`,
        },
        {
          role: "user",
          content: postContent,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      type: result.type,
      content: result.content,
      confidence: Math.max(0, Math.min(1, result.confidence)),
    };
  } catch (error) {
    throw new Error("Failed to generate AI response: " + error.message);
  }
}
