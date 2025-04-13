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
  
  // Add tracing for all HTTP methods
  ['get', 'post', 'put', 'patch', 'delete', 'head'].forEach(method => {
    const originalMethod = agent[method];
    
    agent[method] = function(url) {
      const request = originalMethod.apply(this, arguments);
      const originalEnd = request.end;
      
      request.end = function(callback) {
        const startTime = Date.now();
        
        return originalEnd.call(this, function(err, res) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
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
      
      return request;
    };
  });
  
  return agent;
}

/**
 * Wraps an existing supertest agent with tracing
 * @param {Object} existingAgent - Existing supertest agent
 * @returns {Object} - A traced supertest agent
 */
function traceAgent(existingAgent) {
  const agent = existingAgent;
  
  // Add tracing for all HTTP methods
  ['get', 'post', 'put', 'patch', 'delete', 'head'].forEach(method => {
    const originalMethod = agent[method];
    
    agent[method] = function(url) {
      const request = originalMethod.apply(this, arguments);
      const originalEnd = request.end;
      
      request.end = function(callback) {
        const startTime = Date.now();
        
        return originalEnd.call(this, function(err, res) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
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
      
      return request;
    };
  });
  
  return agent;
}

module.exports = {
  createTracedAgent,
  traceAgent
};