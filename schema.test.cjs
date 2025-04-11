/**
 * Test for basic schema validation using CommonJS format
 */

const { z } = require('zod');

// Define a simple schema for testing
const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email().optional(),
  age: z.number().min(13).optional()
});

describe('Zod Schema Validation', () => {
  test('validates valid user data', () => {
    const validUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      age: 25
    };
    
    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });
  
  test('rejects invalid user data', () => {
    const invalidUser = {
      id: 'not-a-number',
      username: 123, // should be a string
      email: 'not-an-email'
    };
    
    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });
  
  test('schema validates with optional fields missing', () => {
    const minimalUser = {
      id: 1,
      username: 'minimaluser'
    };
    
    const result = userSchema.safeParse(minimalUser);
    expect(result.success).toBe(true);
  });
});