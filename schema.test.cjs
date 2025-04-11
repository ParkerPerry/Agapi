/**
 * Basic schema validation tests to verify that Zod validation is working
 */
const { z } = require('zod');

// Define a basic schema for testing
const userSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  roles: z.array(z.string()).optional()
});

describe('Zod Schema Validation', () => {
  test('validates valid user data', () => {
    const validUser = {
      username: 'testuser',
      email: 'test@example.com',
      age: 25,
      roles: ['user', 'admin']
    };
    
    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validUser);
  });
  
  test('rejects invalid user data', () => {
    const invalidUser = {
      username: 'a', // too short
      email: 'not-an-email',
      age: -5 // negative number
    };
    
    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  test('schema validates with optional fields missing', () => {
    const minimalUser = {
      username: 'testuser',
      email: 'test@example.com'
    };
    
    const result = userSchema.safeParse(minimalUser);
    expect(result.success).toBe(true);
  });
});