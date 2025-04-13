/**
 * API Trace Reporter for Jest
 * 
 * This reporter generates detailed API trace reports from API calls logged
 * during test execution using the api-trace-logger module.
 */
const fs = require('fs');
const path = require('path');
const apiTraceLogger = require('./api-trace-logger.cjs');

class ApiTraceReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options || {};
    this.outputDir = options.outputDir || './test-reports';
    this.outputFile = options.outputFile || 'api-trace-report.json';
    this.htmlReport = options.htmlReport || 'api-trace-report.html';
  }

  onRunStart() {
    // Clear previous API calls
    apiTraceLogger.clearApiCalls();
  }

  onTestStart(test) {
    // Track the current test
    apiTraceLogger.initializeTest({
      name: test.name,
      path: test.path,
      fullName: test.fullName
    });
  }

  onTestEnd() {
    // Clear current test
    apiTraceLogger.clearTest();
  }

  onRunComplete() {
    // Use setTimeout to ensure all API calls are processed
    // by allowing the event loop to complete first
    setTimeout(() => {
      // Get API calls from both memory logger and global variable if available
      const memoryApiCalls = apiTraceLogger.getApiCalls();
      const globalApiCalls = global.__apiTraces || [];
      
      // Combine API calls, prioritizing memory logger calls
      const apiCalls = [...memoryApiCalls];
      
      // Add global API calls that aren't already in memory logger
      if (globalApiCalls.length > memoryApiCalls.length) {
        console.log(`[API Trace Reporter] Found additional API calls in global storage (${globalApiCalls.length})`);
        
        // Simple deduplication by request URL and method
        const existingUrls = new Set(
          memoryApiCalls.map(call => `${call.request?.method || ''}:${call.request?.url || ''}`)
        );
        
        globalApiCalls.forEach(call => {
          const key = `${call.request?.method || ''}:${call.request?.url || ''}`;
          if (!existingUrls.has(key)) {
            apiCalls.push(call);
            existingUrls.add(key);
          }
        });
      }
      
      console.log(`\n[API Trace Reporter] Processing ${apiCalls.length} API calls`);
      
      // If no API calls, no need to generate reports
      if (apiCalls.length === 0) {
        console.log('\n[API Trace Reporter] No API calls were traced during test execution.');
        console.log('[API Trace Reporter] This could be because:');
        console.log('  1. The tests did not make any API calls');
        console.log('  2. The tracedAgent was not properly used in the tests');
        console.log('  3. The API calls are being made asynchronously and completing after the reporter runs');
        console.log('\nPossible solution: Make sure to await all API calls in your tests and use the tracedAgent for all requests.');
        return;
      }
      
      // Also store in global.__apiTraces for other scripts to use
      global.__apiTraces = apiCalls;
      
      // Ensure the output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      try {
        // Get the constructor options for debugging
        console.log(`\n[API Trace Reporter] Reporter instantiated with options:`);
        console.log(JSON.stringify(this.options, null, 2));
        
        // Debug configuration values
        console.log(`\n[API Trace Reporter] Configuration:`);
        console.log(`  Output Directory: ${this.outputDir}`);
        console.log(`  JSON Output File: ${this.outputFile}`);
        console.log(`  HTML Report: ${this.htmlReport}`);
        
        // Write the API calls to a JSON file
        const outputJsonPath = path.join(this.outputDir, this.outputFile);
        fs.writeFileSync(outputJsonPath, JSON.stringify(apiCalls, null, 2));
        console.log(`[API Trace Reporter] Saved API calls to ${outputJsonPath}`);
        
        // Generate an HTML report for easier viewing
        const htmlOutputPath = path.join(this.outputDir, this.htmlReport);
        console.log(`[API Trace Reporter] Attempting to create HTML report at: ${htmlOutputPath}`);
        
        // Check if file or directory exists before attempting to write
        if (fs.existsSync(htmlOutputPath)) {
          if (fs.statSync(htmlOutputPath).isDirectory()) {
            console.log(`[API Trace Reporter] ERROR: ${htmlOutputPath} is a directory, cannot write file`);
          } else {
            console.log(`[API Trace Reporter] File exists, will be overwritten: ${htmlOutputPath}`);
          }
        }
        
        this.generateHtmlReport(apiCalls, htmlOutputPath);
        
        // Verify the HTML report was created
        if (fs.existsSync(htmlOutputPath)) {
          const stats = fs.statSync(htmlOutputPath);
          console.log(`[API Trace Reporter] HTML report created successfully: ${htmlOutputPath} (${stats.size} bytes)`);
        } else {
          console.log(`[API Trace Reporter] ERROR: Failed to create HTML report at ${htmlOutputPath}`);
        }
        
        console.log(`\n[API Trace Reporter] API Trace Report generated: ${outputJsonPath}`);
        console.log(`[API Trace Reporter] HTML Report generated: ${htmlOutputPath}`);
        console.log(`[API Trace Reporter] Total API calls traced: ${apiCalls.length}`);
      } catch (error) {
        console.error(`[API Trace Reporter] ERROR during report generation: ${error.message}`);
        console.error(error.stack);
      }
      
      // Stats
      const methodCounts = apiCalls.reduce((counts, call) => {
        const method = call.request?.method || 'UNKNOWN';
        counts[method] = (counts[method] || 0) + 1;
        return counts;
      }, {});
      
      console.log('\n[API Trace Reporter] API Call Statistics:');
      Object.entries(methodCounts).forEach(([method, count]) => {
        console.log(`  ${method}: ${count} calls`);
      });
      
      // Status code summary
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
      
      console.log('\n[API Trace Reporter] Status Code Summary:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} calls`);
      });
      
      // Average response time
      const totalTime = apiCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
      const avgTime = Math.round(totalTime / apiCalls.length);
      console.log(`\n[API Trace Reporter] Average response time: ${avgTime}ms`);
    }, 1000); // Wait 1 second to ensure all async operations complete
  }

  generateHtmlReport(apiCalls, htmlPath) {
    // If htmlPath is not provided, use default
    htmlPath = htmlPath || path.join(this.outputDir, this.htmlReport);
    
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
        <h1>API Trace Report</h1>
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
            <div class="stat-value">${apiCalls.filter(call => call.request?.method === 'GET').length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">POST Requests</div>
            <div class="stat-value">${apiCalls.filter(call => call.request?.method === 'POST').length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">PUT/PATCH Requests</div>
            <div class="stat-value">${apiCalls.filter(call => ['PUT', 'PATCH'].includes(call.request?.method)).length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">DELETE Requests</div>
            <div class="stat-value">${apiCalls.filter(call => call.request?.method === 'DELETE').length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Average Response Time</div>
            <div class="stat-value">${Math.round(apiCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / apiCalls.length)}ms</div>
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
}

module.exports = ApiTraceReporter;