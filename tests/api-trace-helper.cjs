/**
 * API Trace Helper
 * 
 * This module provides wrapper functions around supertest to automatically log
 * API requests and responses during test execution.
 */
const supertest = require('supertest');
const apiTraceLogger = require('./api-trace-logger.cjs');
const fs = require('fs');
const path = require('path');

// Ensure the directory exists
const TRACE_DIR = path.join(process.cwd(), 'test-reports');
if (!fs.existsSync(TRACE_DIR)) {
  fs.mkdirSync(TRACE_DIR, { recursive: true });
}

// File path for storing trace data
const TRACE_FILE = path.join(TRACE_DIR, 'api-traces.json');

// Initialize trace file if it doesn't exist
if (!fs.existsSync(TRACE_FILE)) {
  fs.writeFileSync(TRACE_FILE, JSON.stringify([]));
}

// Load existing trace data
let traceData = [];
try {
  const fileContent = fs.readFileSync(TRACE_FILE, 'utf8');
  traceData = JSON.parse(fileContent);
  if (!Array.isArray(traceData)) traceData = [];
} catch (error) {
  console.error('Error reading trace file:', error);
  traceData = [];
}

// Utility for saving trace data to file
function saveTraceData(data) {
  traceData.push(data);
  try {
    fs.writeFileSync(TRACE_FILE, JSON.stringify(traceData, null, 2));
  } catch (error) {
    console.error('Error saving trace data:', error);
  }
}

/**
 * Creates a traced agent that wraps supertest
 * @param {string} baseUrl - The base URL to test
 * @returns {Object} - A traced supertest agent
 */
function createTracedAgent(baseUrl) {
  const agent = supertest.agent(baseUrl);
  return wrapSuperTestAgent(agent);
}

/**
 * Wraps an existing supertest agent with tracing
 * @param {Object} existingAgent - Existing supertest agent
 * @returns {Object} - A traced supertest agent
 */
function traceAgent(existingAgent) {
  return wrapSuperTestAgent(existingAgent);
}

/**
 * Get current test context from Jest's global object
 * @returns {Object|null} - Current test info or null
 */
function getCurrentTest() {
  // Access Jest's global environment to get current test
  if (global.expect && global.expect.getState) {
    const state = global.expect.getState();
    if (state && state.currentTestName) {
      return {
        name: state.currentTestName,
        fullName: state.currentTestName,
        path: state.testPath || 'unknown'
      };
    }
  }
  return null;
}

/**
 * Internal helper to wrap a supertest agent with tracing
 * @param {Object} agent - The supertest agent to wrap
 * @returns {Object} - A traced supertest agent
 */
function wrapSuperTestAgent(agent) {
  // Add tracing for all HTTP methods
  ['get', 'post', 'put', 'patch', 'delete', 'head'].forEach(method => {
    const originalMethod = agent[method];
    
    agent[method] = function(url) {
      console.log(`[API Trace] Starting ${method.toUpperCase()} request to ${url}`);
      const request = originalMethod.apply(this, arguments);
      const originalEnd = request.end;
      const originalThen = request.then;
      
      // Get the current test information
      const currentTest = getCurrentTest();
      
      // Track the request data for logging
      const requestData = {
        method: method.toUpperCase(),
        url,
        headers: request._headers || {},
        body: request._data || {}
      };
      
      // Intercept both .end() and .then() since Jest tests 
      // commonly use .then() with supertest
      
      // Override .end() method
      request.end = function(callback) {
        const startTime = Date.now();
        
        return originalEnd.call(this, function(err, res) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log(`[API Trace] Completed ${method.toUpperCase()} request to ${url} with status ${res ? res.status : 'error'}`);
          
          // Prepare trace data
          const traceEntry = {
            request: requestData,
            response: res ? {
              status: res.status,
              statusText: res.statusText,
              headers: res.headers,
              body: res.body
            } : null,
            error: err ? {
              message: err.message,
              stack: err.stack
            } : null,
            duration,
            timestamp: new Date().toISOString(),
            test: currentTest
          };
          
          // Save to our file-based storage
          saveTraceData(traceEntry);
          
          // Also log to memory-based logger for reporter
          apiTraceLogger.logApiCall(
            requestData,
            traceEntry.response,
            err,
            duration
          );
          
          // Call the original callback
          if (callback) {
            callback(err, res);
          }
        });
      };
      
      // Override .then() method
      request.then = function(onFulfilled, onRejected) {
        const startTime = Date.now();
        
        return originalThen.call(this, 
          function(res) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`[API Trace] Completed ${method.toUpperCase()} request to ${url} with status ${res ? res.status : 'unknown'}`);
            
            // Prepare trace data
            const traceEntry = {
              request: requestData,
              response: res ? {
                status: res.status,
                statusText: res.statusText,
                headers: res.headers,
                body: res.body
              } : null,
              error: null,
              duration,
              timestamp: new Date().toISOString(),
              test: currentTest
            };
            
            // Save to our file-based storage
            saveTraceData(traceEntry);
            
            // Also log to memory-based logger for reporter
            apiTraceLogger.logApiCall(
              requestData,
              traceEntry.response,
              null,
              duration
            );
            
            return onFulfilled ? onFulfilled(res) : res;
          },
          function(err) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`[API Trace] Error in ${method.toUpperCase()} request to ${url}: ${err.message}`);
            
            // Prepare trace data
            const traceEntry = {
              request: requestData,
              response: null,
              error: {
                message: err.message,
                stack: err.stack
              },
              duration,
              timestamp: new Date().toISOString(),
              test: currentTest
            };
            
            // Save to our file-based storage
            saveTraceData(traceEntry);
            
            // Also log to memory-based logger for reporter
            apiTraceLogger.logApiCall(
              requestData,
              null,
              err,
              duration
            );
            
            return onRejected ? onRejected(err) : Promise.reject(err);
          }
        );
      };
      
      return request;
    };
  });
  
  return agent;
}

// Export the API for generating additional trace files
function generateTraceReport(traceName) {
  const traceFileName = traceName || 'api-traces';
  const outputPath = path.join(TRACE_DIR, `${traceFileName}.json`);
  
  try {
    fs.writeFileSync(outputPath, JSON.stringify(traceData, null, 2));
    console.log(`[API Trace] Generated trace report: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`[API Trace] Failed to generate trace report: ${error.message}`);
    return null;
  }
}

// Export clear trace data function for testing
function clearTraceData() {
  traceData = [];
  try {
    fs.writeFileSync(TRACE_FILE, JSON.stringify([]));
    console.log('[API Trace] Cleared trace data');
  } catch (error) {
    console.error('[API Trace] Failed to clear trace data:', error);
  }
}

module.exports = {
  createTracedAgent,
  traceAgent,
  generateTraceReport,
  clearTraceData
};