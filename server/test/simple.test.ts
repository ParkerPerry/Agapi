/**
 * Simple test to verify Jest is working
 */

describe('Simple test', () => {
  test('basic assertions work', () => {
    expect(1 + 1).toBe(2);
    expect(true).toBe(true);
    expect([1, 2, 3]).toHaveLength(3);
    expect('hello').toContain('hell');
  });
});