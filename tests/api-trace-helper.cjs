/**
 * API Trace Helper
 * 
 * This module provides wrapper functions around supertest to automatically log
 * API requests and responses during test execution.
 */
const supertest = require('supertest');
const apiTraceLogger = require('./api-trace-logger.cjs');

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
      
      // Intercept both .end() and .then() since Jest tests 
      // commonly use .then() with supertest
      
      // Override .end() method
      request.end = function(callback) {
        const startTime = Date.now();
        
        return originalEnd.call(this, function(err, res) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log(`[API Trace] Completed ${method.toUpperCase()} request to ${url} with status ${res ? res.status : 'error'}`);
          
          // Log the API call
          apiTraceLogger.logApiCall(
            {
              method: method.toUpperCase(),
              url,
              headers: request._headers || {},
              body: request._data || {}
            },
            res ? {
              status: res.status,
              statusText: res.statusText,
              headers: res.headers,
              body: res.body
            } : null,
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
            
            // Log the API call
            apiTraceLogger.logApiCall(
              {
                method: method.toUpperCase(),
                url,
                headers: request._headers || {},
                body: request._data || {}
              },
              res ? {
                status: res.status,
                statusText: res.statusText,
                headers: res.headers,
                body: res.body
              } : null,
              null,
              duration
            );
            
            return onFulfilled ? onFulfilled(res) : res;
          },
          function(err) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`[API Trace] Error in ${method.toUpperCase()} request to ${url}: ${err.message}`);
            
            // Log the API call with error
            apiTraceLogger.logApiCall(
              {
                method: method.toUpperCase(),
                url,
                headers: request._headers || {},
                body: request._data || {}
              },
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

module.exports = {
  createTracedAgent,
  traceAgent
};