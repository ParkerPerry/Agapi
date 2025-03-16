require('dotenv').config();

// Mock OpenAI for testing
jest.mock('openai', () => {
  class MockOpenAI {
    constructor() {
      this.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  type: "comment",
                  content: "Test AI response",
                  confidence: 0.95
                })
              }
            }]
          })
        }
      };
    }
  }
  return { default: MockOpenAI };
});

// Mock WebSocket for testing
jest.mock('ws', () => ({
  WebSocketServer: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    clients: new Set(),
    close: jest.fn()
  })),
  WebSocket: jest.fn()
}));