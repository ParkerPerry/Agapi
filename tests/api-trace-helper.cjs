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
  const htmlPath = path.join(TRACE_DIR, `${traceFileName}.html`);
  
  try {
    // Save JSON file
    fs.writeFileSync(outputPath, JSON.stringify(traceData, null, 2));
    console.log(`[API Trace] Generated trace report: ${outputPath}`);
    
    // Generate HTML report
    generateHtmlReport(traceData, htmlPath);
    console.log(`[API Trace] Generated HTML report: ${htmlPath}`);
    
    return outputPath;
  } catch (error) {
    console.error(`[API Trace] Failed to generate trace report: ${error.message}`);
    return null;
  }
}

/**
 * Generate an HTML report from trace data
 * @param {Array} apiCalls - Array of API call data
 * @param {string} htmlPath - Path to save HTML file
 */
function generateHtmlReport(apiCalls, htmlPath) {
  if (!apiCalls || apiCalls.length === 0) {
    console.log('[API Trace] No API calls to generate HTML report');
    return;
  }
  
  // Group API calls by test
  const testGroups = {};
  apiCalls.forEach(call => {
    if (!call.test) {
      // For API calls not associated with a test
      if (!testGroups['Unassociated API Calls']) {
        testGroups['Unassociated API Calls'] = [];
      }
      testGroups['Unassociated API Calls'].push(call);
      return;
    }
    
    const testName = call.test.fullName || call.test.name || 'Unknown Test';
    if (!testGroups[testName]) {
      testGroups[testName] = [];
    }
    testGroups[testName].push(call);
  });
  
  // Calculate stats
  const methodCounts = apiCalls.reduce((counts, call) => {
    const method = call.request?.method || 'UNKNOWN';
    counts[method] = (counts[method] || 0) + 1;
    return counts;
  }, {});
  
  const statusCounts = apiCalls.reduce((counts, call) => {
    if (call.response) {
      const statusGroup = Math.floor(call.response.status / 100) * 100;
      const label = {
        200: '2xx (Success)',
        300: '3xx (Redirect)',
        400: '4xx (Client Error)',
        500: '5xx (Server Error)'
      }[statusGroup] || `${statusGroup}xx`;
      
      counts[label] = (counts[label] || 0) + 1;
    } else {
      counts['Error/No Response'] = (counts['Error/No Response'] || 0) + 1;
    }
    return counts;
  }, {});
  
  const totalTime = apiCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
  const avgTime = Math.round(totalTime / apiCalls.length);
  
  // Generate HTML
  let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CircleTube API Trace Report</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 20px;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        background-color: #fff;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      h1 {
        color: #2c3e50;
        border-bottom: 2px solid #3498db;
        padding-bottom: 10px;
      }
      h2 {
        color: #2c3e50;
        margin-top: 30px;
        padding-bottom: 8px;
        border-bottom: 1px solid #ddd;
      }
      .test-name {
        background-color: #f8f9fa;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 15px;
        border-left: 4px solid #3498db;
      }
      .api-call {
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 15px;
        background-color: #fff;
      }
      .api-call-header {
        display: flex;
        justify-content: space-between;
        background-color: #e9ecef;
        padding: 8px 15px;
        cursor: pointer;
        user-select: none;
      }
      .api-call-method {
        font-weight: bold;
        margin-right: 10px;
      }
      .method-GET { color: #28a745; }
      .method-POST { color: #007bff; }
      .method-PUT, .method-PATCH { color: #fd7e14; }
      .method-DELETE { color: #dc3545; }
      .status-success { color: #28a745; }
      .status-redirect { color: #fd7e14; }
      .status-client-error { color: #dc3545; }
      .status-server-error { color: #dc3545; }
      .api-call-details {
        padding: 15px;
        display: none;
        border-top: 1px solid #ddd;
      }
      .active .api-call-details {
        display: block;
      }
      .detail-section {
        margin-bottom: 15px;
      }
      .detail-section h4 {
        margin-bottom: 5px;
        color: #555;
      }
      pre {
        background-color: #f8f9fa;
        padding: 10px;
        border-radius: 4px;
        overflow: auto;
        margin: 0;
      }
      .summary {
        margin-bottom: 20px;
        padding: 15px;
        background-color: #e9ecef;
        border-radius: 4px;
      }
      .menu {
        position: sticky;
        top: 10px;
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        background-color: #fff;
        padding: 15px;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 20px;
      }
      .menu ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
      }
      .menu li {
        margin-bottom: 8px;
      }
      .menu a {
        color: #3498db;
        text-decoration: none;
      }
      .menu a:hover {
        text-decoration: underline;
      }
      .two-columns {
        display: grid;
        grid-template-columns: 1fr 3fr;
        gap: 20px;
      }
      .stats {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      .stat-item {
        background-color: #e9ecef;
        border-radius: 4px;
        padding: 10px 15px;
        flex: 1;
        min-width: 150px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .stat-label {
        font-size: 12px;
        color: #6c757d;
        margin-bottom: 5px;
      }
      .stat-value {
        font-size: 18px;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>CircleTube API Trace Report</h1>
      <div class="summary">
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total API Calls:</strong> ${apiCalls.length}</p>
        <p><strong>Tests:</strong> ${Object.keys(testGroups).length}</p>
      </div>
      
      <div class="stats">
        <div class="stat-item">
          <div class="stat-label">Total API Calls</div>
          <div class="stat-value">${apiCalls.length}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">GET Requests</div>
          <div class="stat-value">${methodCounts['GET'] || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">POST Requests</div>
          <div class="stat-value">${methodCounts['POST'] || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">PUT/PATCH Requests</div>
          <div class="stat-value">${(methodCounts['PUT'] || 0) + (methodCounts['PATCH'] || 0)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">DELETE Requests</div>
          <div class="stat-value">${methodCounts['DELETE'] || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Average Response Time</div>
          <div class="stat-value">${avgTime}ms</div>
        </div>
      </div>
      
      <div class="two-columns">
        <div class="menu">
          <h3>Tests</h3>
          <ul>
            ${Object.keys(testGroups).map(testName => 
              `<li><a href="#${encodeURIComponent(testName)}">${testName}</a></li>`
            ).join('')}
          </ul>
        </div>
        
        <div class="content">
  `;
  
  // Add each test group
  Object.entries(testGroups).forEach(([testName, calls]) => {
    html += `
      <div class="test-group">
        <h2 id="${encodeURIComponent(testName)}" class="test-name">${testName}</h2>
    `;
    
    // Add each API call
    calls.forEach((call, index) => {
      const statusCode = call.response?.status;
      let statusClass = '';
      
      if (statusCode >= 200 && statusCode < 300) statusClass = 'status-success';
      else if (statusCode >= 300 && statusCode < 400) statusClass = 'status-redirect';
      else if (statusCode >= 400 && statusCode < 500) statusClass = 'status-client-error';
      else if (statusCode >= 500) statusClass = 'status-server-error';
      
      html += `
        <div class="api-call" data-call-id="${index}">
          <div class="api-call-header">
            <span>
              <span class="api-call-method method-${call.request?.method}">${call.request?.method || 'UNKNOWN'}</span>
              <span class="api-call-url">${call.request?.url || 'Unknown URL'}</span>
            </span>
            <span class="api-call-status ${statusClass}">${statusCode || 'No response'} (${call.duration || 0}ms)</span>
          </div>
          <div class="api-call-details">
            <div class="detail-section">
              <h4>Request</h4>
              <pre>${JSON.stringify(call.request || {}, null, 2)}</pre>
            </div>
            <div class="detail-section">
              <h4>Response</h4>
              <pre>${JSON.stringify(call.response || {}, null, 2)}</pre>
            </div>
            ${call.error ? `
            <div class="detail-section">
              <h4>Error</h4>
              <pre>${JSON.stringify(call.error, null, 2)}</pre>
            </div>
            ` : ''}
            <div class="detail-section">
              <h4>Timestamp</h4>
              <pre>${call.timestamp}</pre>
            </div>
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  });
  
  html += `
        </div>
      </div>
    </div>
    <script>
      // Add click handlers to expand/collapse API call details
      document.querySelectorAll('.api-call-header').forEach(header => {
        header.addEventListener('click', () => {
          const call = header.parentElement;
          call.classList.toggle('active');
        });
      });
    </script>
  </body>
  </html>
  `;
  
  fs.writeFileSync(htmlPath, html);
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