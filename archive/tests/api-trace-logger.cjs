/**
 * API Trace Logger
 * 
 * This module handles logging of API calls during test execution.
 * It stores API call details for later reporting by the API trace reporter.
 */

// Storage for API calls - make it globally accessible
global.__apiTraces = global.__apiTraces || [];
let apiCalls = global.__apiTraces;
let currentTest = null;

/**
 * Log an API call with request and response details
 * @param {Object} request - The request details
 * @param {Object} response - The response details
 * @param {Error} error - Any error that occurred
 * @param {number} duration - Request duration in milliseconds
 */
function logApiCall(request, response, error, duration) {
  const timestamp = new Date().toISOString();
  
  const apiCall = {
    request,
    response,
    error: error ? {
      message: error.message,
      stack: error.stack
    } : null,
    timestamp,
    duration,
    test: currentTest
  };
  
  apiCalls.push(apiCall);
  return apiCall;
}

/**
 * Initialize the current test context
 * @param {Object} test - The test details
 */
function initializeTest(test) {
  currentTest = test;
}

/**
 * Clear the current test context
 */
function clearTest() {
  currentTest = null;
}

/**
 * Get all logged API calls
 * @returns {Array} - The logged API calls
 */
function getApiCalls() {
  return apiCalls;
}

/**
 * Clear all logged API calls
 */
function clearApiCalls() {
  apiCalls.length = 0;  // Clear the array while keeping the reference
  global.__apiTraces = apiCalls;  // Ensure global reference is updated
}

module.exports = {
  logApiCall,
  initializeTest,
  clearTest,
  getApiCalls,
  clearApiCalls
};