/**
 * API Trace Logger Module
 * 
 * This module provides functions to track API requests and responses
 * during test execution. Tests can use these functions to log API calls.
 */

// Store all API calls with request/response details
const apiCalls = [];
let currentTest = null;

/**
 * Initialize a test for API tracing
 * @param {Object} testInfo - Test information (name, path, etc.)
 */
function initializeTest(testInfo) {
  currentTest = testInfo;
}

/**
 * Clear the current test tracking
 */
function clearTest() {
  currentTest = null;
}

/**
 * Log an API call with request and response details
 * @param {Object} request - Request details
 * @param {Object} response - Response details
 * @param {Error} error - Error, if any occurred
 * @param {number} duration - Request duration in ms
 */
function logApiCall(request, response, error = null, duration = 0) {
  const apiCall = {
    test: currentTest,
    timestamp: new Date().toISOString(),
    duration,
    request,
    response,
    error: error ? {
      message: error.message,
      stack: error.stack
    } : null
  };
  
  apiCalls.push(apiCall);
}

/**
 * Get all logged API calls
 * @returns {Array} - Array of logged API calls
 */
function getApiCalls() {
  return [...apiCalls];
}

/**
 * Clear all logged API calls
 */
function clearApiCalls() {
  apiCalls.length = 0;
}

module.exports = {
  initializeTest,
  clearTest,
  logApiCall,
  getApiCalls,
  clearApiCalls
};