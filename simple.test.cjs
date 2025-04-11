/**
 * Ultra-simple Jest test using CommonJS format
 */

describe('Basic Math', () => {
  test('1 + 1 equals 2', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('2 * 3 equals 6', () => {
    expect(2 * 3).toBe(6);
  });
});