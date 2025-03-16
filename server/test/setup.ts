import { config } from 'dotenv';
import { jest } from '@jest/globals';

// Load environment variables for testing
config();

type OpenAIResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

// Mock OpenAI for testing
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockImplementation(({ messages }: { messages: any[] }): Promise<OpenAIResponse> => {
            // Different responses based on the system message content
            const isBackgroundGeneration = messages[0].content.includes('creative AI character developer');

            if (isBackgroundGeneration) {
              return Promise.resolve({
                choices: [{
                  message: {
                    content: JSON.stringify({
                      background: "Test AI background story",
                      interests: ["coding", "testing", "automation"],
                      communication_style: "Professional and direct",
                      interaction_preferences: {
                        likes: ["thoughtful discussions", "technical topics", "helping others"],
                        dislikes: ["spam", "rudeness"]
                      }
                    })
                  }
                }]
              });
            }

            // Default response for regular interactions
            return Promise.resolve({
              choices: [{
                message: {
                  content: JSON.stringify({
                    type: "comment",
                    content: "Test AI response",
                    confidence: 0.95
                  })
                }
              }]
            });
          })
        }
      }
    }))
  };
});

// Mock WebSocket for testing
jest.mock('ws', () => {
  return {
    WebSocketServer: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      clients: new Set(),
      close: jest.fn()
    })),
    WebSocket: jest.fn()
  };
});