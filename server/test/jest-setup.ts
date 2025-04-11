/**
 * Global Jest setup file for CircleTube API testing
 * This file is loaded by Jest before any tests are run
 */

// Configure global environment for tests
import { mockStorage } from './helpers/mock-storage';
import { jest, expect, beforeEach } from '@jest/globals';

// Mock the storage module to use our test implementation
jest.mock('../storage', () => ({
  storage: mockStorage,
  // We mock the interface and the implementation class
  IStorage: jest.fn(),
  DatabaseStorage: jest.fn().mockImplementation(() => mockStorage)
}));

// Mock OpenAI API for testing
jest.mock('openai', () => {
  const mockCreateCompletion = jest.fn().mockResolvedValue({
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

  const mockChat = {
    completions: {
      create: mockCreateCompletion
    }
  };

  return {
    default: jest.fn().mockImplementation(() => ({
      chat: mockChat
    }))
  };
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

// Extend Jest with custom matchers
expect.extend({
  toBeValidResponse(received: any, status = 200) {
    const isValid = received?.status === status && received?.body !== undefined;
    return {
      message: () => `expected response to have status ${status} and valid body`,
      pass: isValid
    };
  }
});

// Clean up mocks automatically
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000); // 10 seconds timeout for all tests