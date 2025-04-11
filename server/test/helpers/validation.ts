import { Response } from 'supertest';
import { z } from 'zod';

/**
 * Validates response status code and returns friendly error messages
 * @param {Response} response - Supertest response object
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {string} message - Optional message for assertion
 */
export function validateStatus(response: Response, expectedStatus: number, message?: string): void {
  const failMessage = message || `Expected status ${expectedStatus} but got ${response.status}`;
  expect(response.status).toBe(expectedStatus);
}

/**
 * Validates response content type
 * @param {Response} response - Supertest response object
 * @param {string} contentType - Expected content type
 */
export function validateContentType(response: Response, contentType: string = 'application/json'): void {
  const responseContentType = response.headers['content-type'];
  expect(responseContentType).toMatch(contentType);
}

/**
 * Validates response body against a Zod schema
 * @param {any} data - Response data to validate
 * @param {z.ZodType} schema - Zod schema to validate against
 * @returns {boolean} Whether validation succeeded
 */
export function validateResponseAgainstSchema(data: any, schema: z.ZodType): boolean {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('Schema validation failed:', result.error);
  }
  expect(result.success).toBe(true);
  return result.success;
}

/**
 * Validates pagination in a response
 * @param {any} response - Response to validate
 * @param {number} page - Expected page number
 * @param {number} limit - Expected page size
 * @param {number} total - Expected total count
 */
export function validatePagination(response: any, page: number, limit: number, total: number): void {
  expect(response.pagination).toBeDefined();
  expect(response.pagination.page).toBe(page);
  expect(response.pagination.limit).toBe(limit);
  expect(response.pagination.total).toBe(total);
}

/**
 * Validates error response format
 * @param {Response} response - Supertest response object
 * @param {number} status - Expected HTTP status code
 */
export function validateErrorResponse(response: Response, status: number): void {
  validateStatus(response, status);
  expect(response.body).toHaveProperty('message');
  expect(typeof response.body.message).toBe('string');
}

/**
 * Validates that response contains a valid JWT token
 * @param {Response} response - Supertest response object
 */
export function validateAuthToken(response: Response): void {
  expect(response.body).toHaveProperty('token');
  expect(typeof response.body.token).toBe('string');
  expect(response.body.token.split('.')).toHaveLength(3); // JWT has 3 parts
}