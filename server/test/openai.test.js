const { generateAIResponse } = require('../openai');

describe('OpenAI Integration', () => {
  describe('generateAIResponse', () => {
    it('should generate a response for a post', async () => {
      const response = await generateAIResponse(
        'Hello world!',
        'friendly and enthusiastic'
      );

      expect(response).toMatchObject({
        type: expect.stringMatching(/^(like|comment|reply)$/),
        content: expect.any(String),
        confidence: expect.any(Number)
      });

      expect(response.confidence).toBeGreaterThanOrEqual(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
    });
  });
});