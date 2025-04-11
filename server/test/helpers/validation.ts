/**
 * Validation helpers for tests
 * Utility functions to validate API responses
 */

import { Response } from 'supertest';
import { ZodSchema } from 'zod';

/**
 * Validate response status code
 * @param {Response} response - Supertest response
 * @param {number} expectedStatus - Expected status code
 * @throws {Error} If status code doesn't match expected
 */
export function validateStatus(response: Response, expectedStatus: number): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus} but got ${response.status}: ${
        typeof response.body === 'object' 
          ? JSON.stringify(response.body) 
          : response.text
      }`
    );
  }
}

/**
 * Validate response body against a Zod schema
 * @param {any} responseBody - Response body to validate
 * @param {ZodSchema} schema - Zod schema to validate against
 * @returns {any} Validated response (typed according to schema)
 * @throws {Error} If validation fails
 */
export function validateResponseAgainstSchema<T>(
  responseBody: any, 
  schema: ZodSchema<T>
): T {
  const result = schema.safeParse(responseBody);
  
  if (!result.success) {
    throw new Error(
      `Response validation failed: ${result.error.message}\nResponse body: ${
        JSON.stringify(responseBody, null, 2)
      }`
    );
  }
  
  return result.data;
}

/**
 * Validate response contains expected properties
 * @param {any} responseBody - Response body to validate
 * @param {string[]} expectedProps - Expected property names
 * @throws {Error} If validation fails
 */
export function validateResponseProperties(
  responseBody: any,
  expectedProps: string[]
): void {
  for (const prop of expectedProps) {
    if (!(prop in responseBody)) {
      throw new Error(
        `Response is missing expected property: ${prop}\nResponse body: ${
          JSON.stringify(responseBody, null, 2)
        }`
      );
    }
  }
}

/**
 * Validate response contains expected error message
 * @param {any} responseBody - Response body to validate
 * @param {string} errorText - Text that should be in the error message
 * @throws {Error} If validation fails
 */
export function validateErrorMessage(
  responseBody: any,
  errorText: string
): void {
  if (!responseBody.message) {
    throw new Error(
      `Response is missing error message field\nResponse body: ${
        JSON.stringify(responseBody, null, 2)
      }`
    );
  }
  
  if (!responseBody.message.includes(errorText)) {
    throw new Error(
      `Error message does not contain expected text: "${errorText}"\nActual message: "${responseBody.message}"`
    );
  }
}

/**
 * Validate API pagination response
 * @param {any} responseBody - Response body to validate
 * @param {number} pageSize - Expected page size
 * @throws {Error} If validation fails
 */
export function validatePaginationResponse(
  responseBody: any,
  pageSize: number
): void {
  if (!Array.isArray(responseBody.data)) {
    throw new Error(
      `Expected response.data to be an array\nResponse body: ${
        JSON.stringify(responseBody, null, 2)
      }`
    );
  }
  
  if (responseBody.data.length > pageSize) {
    throw new Error(
      `Expected data array length to be <= ${pageSize}, but got ${
        responseBody.data.length
      }`
    );
  }
  
  if (!('totalCount' in responseBody)) {
    throw new Error(
      `Response is missing totalCount property\nResponse body: ${
        JSON.stringify(responseBody, null, 2)
      }`
    );
  }
  
  if (!('currentPage' in responseBody)) {
    throw new Error(
      `Response is missing currentPage property\nResponse body: ${
        JSON.stringify(responseBody, null, 2)
      }`
    );
  }
}