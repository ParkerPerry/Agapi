/**
 * API Trace Reporter for Jest
 * 
 * This reporter captures API request/response details during test execution
 * and generates a detailed report of all API interactions.
 */
const fs = require('fs');
const path = require('path');

// Store all API calls with request/response details
let apiCalls = [];

// Track the current test being executed
let currentTest = null;

class ApiTraceReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options || {};
    this.outputDir = options.outputDir || './test-reports';
    this.outputFile = options.outputFile || 'api-trace-report.json';
    this.htmlReport = options.htmlReport || 'api-trace-report.html';
    this.apiCalls = [];
    
    // Hook into the supertest library to capture request/response
    this.setupSupertestHook();
  }

  setupSupertestHook() {
    try {
      // Hook into the supertest request execution
      const supertest = require('supertest');
      const originalRequest = supertest.Request.prototype.end;
      
      supertest.Request.prototype.end = function(fn) {
        const req = this;
        const startTime = Date.now();
        
        return originalRequest.call(this, function(err, res) {
          const endTime = Date.now();
          
          // Capture API call details
          if (currentTest) {
            const apiCall = {
              test: currentTest,
              timestamp: new Date().toISOString(),
              duration: endTime - startTime,
              request: {
                method: req.method,
                url: req.url,
                headers: req._header || {},
                body: req._data || {},
              },
              response: {
                status: res ? res.status : null,
                statusText: res ? res.statusText : null,
                headers: res ? res.headers : {},
                body: res ? res.body : null,
              },
              error: err ? {
                message: err.message,
                stack: err.stack
              } : null
            };
            
            apiCalls.push(apiCall);
          }
          
          // Call the original callback
          if (fn) return fn(err, res);
        });
      };
    } catch (e) {
      console.warn('Failed to hook into supertest:', e.message);
    }
  }

  onRunStart() {
    // Clear previous API calls
    apiCalls = [];
  }

  onTestStart(test) {
    // Track the current test
    currentTest = {
      name: test.name,
      path: test.path,
      fullName: test.fullName
    };
  }

  onTestEnd() {
    // Clear current test
    currentTest = null;
  }

  onRunComplete() {
    // Ensure the output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Write the API calls to a JSON file
    const outputPath = path.join(this.outputDir, this.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(apiCalls, null, 2));
    
    // Generate an HTML report for easier viewing
    this.generateHtmlReport();
    
    console.log(`\nAPI Trace Report generated: ${outputPath}`);
    console.log(`HTML Report generated: ${path.join(this.outputDir, this.htmlReport)}`);
  }

  generateHtmlReport() {
    const htmlPath = path.join(this.outputDir, this.htmlReport);
    
    // Group API calls by test
    const testGroups = {};
    apiCalls.forEach(call => {
      const testName = call.test.fullName;
      if (!testGroups[testName]) {
        testGroups[testName] = [];
      }
      testGroups[testName].push(call);
    });
    
    // Generate HTML
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Trace Report</title>
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
      </style>
    </head>
    <body>
      <div class="container">
        <h1>API Trace Report</h1>
        <div class="summary">
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total API Calls:</strong> ${apiCalls.length}</p>
          <p><strong>Tests:</strong> ${Object.keys(testGroups).length}</p>
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
        const statusCode = call.response.status;
        let statusClass = '';
        
        if (statusCode >= 200 && statusCode < 300) statusClass = 'status-success';
        else if (statusCode >= 300 && statusCode < 400) statusClass = 'status-redirect';
        else if (statusCode >= 400 && statusCode < 500) statusClass = 'status-client-error';
        else if (statusCode >= 500) statusClass = 'status-server-error';
        
        html += `
          <div class="api-call" data-call-id="${index}">
            <div class="api-call-header">
              <span>
                <span class="api-call-method method-${call.request.method}">${call.request.method}</span>
                <span class="api-call-url">${call.request.url}</span>
              </span>
              <span class="api-call-status ${statusClass}">${call.response.status} (${call.duration}ms)</span>
            </div>
            <div class="api-call-details">
              <div class="detail-section">
                <h4>Request</h4>
                <pre>${JSON.stringify(call.request, null, 2)}</pre>
              </div>
              <div class="detail-section">
                <h4>Response</h4>
                <pre>${JSON.stringify(call.response, null, 2)}</pre>
              </div>
              ${call.error ? `
              <div class="detail-section">
                <h4>Error</h4>
                <pre>${JSON.stringify(call.error, null, 2)}</pre>
              </div>
              ` : ''}
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
}

module.exports = ApiTraceReporter;