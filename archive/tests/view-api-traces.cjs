/**
 * API Trace Viewer Utility
 * 
 * This utility provides a simple way to view API trace reports from the command line.
 * It helps developers quickly inspect API calls made during tests.
 */
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const showStats = args.includes('--stats') || args.includes('-s');
const showBody = args.includes('--body') || args.includes('-b');
const format = args.find(arg => arg.startsWith('--format=') || arg.startsWith('-f='))?.split('=')[1] || 'table';
const file = args.find(arg => !arg.startsWith('-')) || 'test-reports/api-traces.json';

// Help message
if (showHelp) {
  console.log(`
API Trace Viewer Utility
------------------------

Usage: node tests/view-api-traces.js [options] [file]

Options:
  --help, -h         Show this help message
  --stats, -s        Show statistics about API calls
  --body, -b         Show request and response bodies (can be verbose)
  --format=<format>, -f=<format>  Output format: table, json, csv (default: table)

Arguments:
  file               Path to the trace file (default: test-reports/api-traces.json)

Examples:
  node tests/view-api-traces.js
  node tests/view-api-traces.js test-reports/validation-api-trace.json --stats
  node tests/view-api-traces.js --body --format=json
  `);
  process.exit(0);
}

// Load trace data
let traceData = [];
try {
  const filePath = path.resolve(process.cwd(), file);
  console.log(`Loading trace data from: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File does not exist: ${filePath}`);
    process.exit(1);
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  traceData = JSON.parse(fileContent);
  
  if (!Array.isArray(traceData)) {
    console.error('Error: Trace file does not contain an array of API calls');
    process.exit(1);
  }
  
  console.log(`Loaded ${traceData.length} API calls from trace file`);
} catch (error) {
  console.error(`Error loading trace file: ${error.message}`);
  process.exit(1);
}

// Show statistics
if (showStats) {
  console.log('\nAPI Call Statistics:');
  console.log('-------------------');
  
  // Method counts
  const methodCounts = traceData.reduce((counts, call) => {
    const method = call.request?.method || 'UNKNOWN';
    counts[method] = (counts[method] || 0) + 1;
    return counts;
  }, {});
  
  console.log('\nHTTP Methods:');
  Object.entries(methodCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      console.log(`  ${method}: ${count} calls`);
    });
  
  // Status code distribution
  const statusCounts = traceData.reduce((counts, call) => {
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
  
  console.log('\nStatus Codes:');
  Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      console.log(`  ${status}: ${count} calls`);
    });
  
  // Timing information
  const totalTime = traceData.reduce((sum, call) => sum + (call.duration || 0), 0);
  const avgTime = Math.round(totalTime / traceData.length);
  const maxTime = Math.max(...traceData.map(call => call.duration || 0));
  const minTime = Math.min(...traceData.filter(call => call.duration).map(call => call.duration));
  
  console.log('\nTiming:');
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Average time: ${avgTime}ms`);
  console.log(`  Max time: ${maxTime}ms`);
  console.log(`  Min time: ${minTime}ms`);
  
  // Most time-consuming endpoints
  const endpointTimes = traceData.reduce((endpoints, call) => {
    const endpoint = `${call.request?.method || 'UNKNOWN'} ${call.request?.url || 'unknown'}`;
    if (!endpoints[endpoint]) {
      endpoints[endpoint] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0
      };
    }
    
    endpoints[endpoint].count++;
    endpoints[endpoint].totalTime += call.duration || 0;
    endpoints[endpoint].avgTime = Math.round(endpoints[endpoint].totalTime / endpoints[endpoint].count);
    endpoints[endpoint].maxTime = Math.max(endpoints[endpoint].maxTime, call.duration || 0);
    
    return endpoints;
  }, {});
  
  console.log('\nTop 5 Endpoints by Avg Time:');
  Object.entries(endpointTimes)
    .sort((a, b) => b[1].avgTime - a[1].avgTime)
    .slice(0, 5)
    .forEach(([endpoint, stats]) => {
      console.log(`  ${endpoint}: ${stats.avgTime}ms avg (${stats.count} calls)`);
    });
  
  // Tests coverage
  const testCounts = traceData.reduce((tests, call) => {
    const testName = call.test?.fullName || call.test?.name || 'Unknown Test';
    tests[testName] = (tests[testName] || 0) + 1;
    return tests;
  }, {});
  
  console.log('\nTest Coverage:');
  Object.entries(testCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([test, count]) => {
      console.log(`  ${test}: ${count} calls`);
    });
}

// Format and display the trace data
if (format === 'table' && !showBody) {
  console.log('\nAPI Calls:');
  console.log('-'.repeat(100));
  console.log('| Method |       URL                         | Status | Time (ms) | Test');
  console.log('-'.repeat(100));
  
  traceData.forEach(call => {
    const method = call.request?.method || 'UNKNOWN';
    const url = call.request?.url || 'unknown';
    const status = call.response?.status || 'N/A';
    const time = call.duration || 'N/A';
    const test = call.test?.name || 'unknown';
    
    // Format for table display
    const methodStr = method.padEnd(6);
    const urlStr = url.length > 30 ? url.substring(0, 27) + '...' : url.padEnd(30);
    const statusStr = String(status).padEnd(6);
    const timeStr = String(time).padEnd(9);
    
    console.log(`| ${methodStr} | ${urlStr} | ${statusStr} | ${timeStr} | ${test}`);
  });
  
  console.log('-'.repeat(100));
} else if (format === 'json') {
  // Output as JSON
  const output = traceData.map(call => {
    const result = {
      method: call.request?.method,
      url: call.request?.url,
      status: call.response?.status,
      duration: call.duration,
      test: call.test?.name,
      timestamp: call.timestamp
    };
    
    if (showBody) {
      result.requestBody = call.request?.body;
      result.responseBody = call.response?.body;
    }
    
    return result;
  });
  
  console.log(JSON.stringify(output, null, 2));
} else if (format === 'csv') {
  // Output as CSV
  const headers = ['Method', 'URL', 'Status', 'Duration', 'Test', 'Timestamp'];
  if (showBody) {
    headers.push('RequestBody', 'ResponseBody');
  }
  
  console.log(headers.join(','));
  
  traceData.forEach(call => {
    const values = [
      call.request?.method || '',
      `"${(call.request?.url || '').replace(/"/g, '""')}"`,
      call.response?.status || '',
      call.duration || '',
      `"${(call.test?.name || '').replace(/"/g, '""')}"`,
      call.timestamp || ''
    ];
    
    if (showBody) {
      values.push(
        `"${JSON.stringify(call.request?.body || {}).replace(/"/g, '""')}"`,
        `"${JSON.stringify(call.response?.body || {}).replace(/"/g, '""')}"`
      );
    }
    
    console.log(values.join(','));
  });
} else if (showBody) {
  // Detailed view with bodies
  traceData.forEach((call, index) => {
    console.log(`\nAPI Call #${index + 1}:`);
    console.log(`  Method:   ${call.request?.method || 'UNKNOWN'}`);
    console.log(`  URL:      ${call.request?.url || 'unknown'}`);
    console.log(`  Status:   ${call.response?.status || 'N/A'}`);
    console.log(`  Duration: ${call.duration || 'N/A'}ms`);
    console.log(`  Test:     ${call.test?.name || 'unknown'}`);
    console.log(`  Time:     ${call.timestamp || 'unknown'}`);
    
    console.log('\n  Request Body:');
    console.log('  ' + JSON.stringify(call.request?.body || {}, null, 2).replace(/\n/g, '\n  '));
    
    console.log('\n  Response Body:');
    console.log('  ' + JSON.stringify(call.response?.body || {}, null, 2).replace(/\n/g, '\n  '));
    
    console.log('\n' + '-'.repeat(80));
  });
}

console.log('\nDone.');