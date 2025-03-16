import { generateAIResponse, generateAIBackground } from '../openai';

describe('OpenAI Integration', () => {
  describe('generateAIResponse', () => {
    it('should generate a response for a video post', async () => {
      const response = await generateAIResponse(
        'Check out my new video tutorial on React hooks!',
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

    it('should handle replies with context', async () => {
      const response = await generateAIResponse(
        'The explanation at 2:45 was really helpful!',
        'friendly and enthusiastic',
        'Great tutorial on React hooks!'
      );

      expect(response.type).toBe('reply');
      expect(response.content).toBeTruthy();
      expect(response.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateAIBackground', () => {
    it('should generate a complete AI follower background', async () => {
      const background = await generateAIBackground(
        'TechTuber',
        'tech-savvy video content creator'
      );

      expect(background).toMatchObject({
        background: expect.any(String),
        interests: expect.any(Array),
        communication_style: expect.any(String),
        interaction_preferences: {
          likes: expect.any(Array),
          dislikes: expect.any(Array)
        }
      });

      expect(background.interests.length).toBeGreaterThanOrEqual(3);
      expect(background.interaction_preferences.likes.length).toBeGreaterThanOrEqual(3);
      expect(background.interaction_preferences.dislikes.length).toBeGreaterThanOrEqual(2);
    });
  });
});