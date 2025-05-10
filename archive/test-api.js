import fetch from 'node-fetch';

// Configuration
const API_BASE = 'http://localhost:5001'; // Using fallback port
const VERBOSE = process.argv.includes('--verbose');
const BASIC_AUTH = process.argv.includes('--with-auth');
const SAVE_RESPONSES = process.argv.includes('--save');

// Basic authentication credentials (for testing)
const AUTH_CREDENTIALS = {
  username: 'testuser',
  password: 'password'
};

// Store cookies for session-based tests
let cookies = [];

/**
 * Format a response for detailed output
 * @param {Object} responseData - Response data
 * @returns {string} - Formatted response
 */
function formatResponse(responseData) {
  if (!responseData) return '';
  
  const json = JSON.stringify(responseData, null, 2);
  if (json.length > 500) {
    return json.substring(0, 497) + '...';
  }
  return json;
}

/**
 * Test a specific API route
 * @param {string} route - The API route to test
 * @param {string} method - HTTP method to use
 * @param {object} body - Request body (for POST/PUT/PATCH)
 * @param {boolean} requiresAuth - Whether this endpoint requires authentication
 * @returns {Promise<Object>} - Test result
 */
async function testRoute(route, method = 'GET', body = null, requiresAuth = false) {
  const endpoint = `${API_BASE}${route}`;
  console.log(`Testing ${method} ${route}...`);
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Add cookies for authenticated requests
  if (cookies.length > 0) {
    options.headers.Cookie = cookies.join('; ');
  }
  
  if (body) {
    options.body = JSON.stringify(body);
    if (VERBOSE) {
      console.log(`  Request body: ${formatResponse(body)}`);
    }
  }
  
  try {
    const startTime = Date.now();
    const response = await fetch(endpoint, options);
    const responseTime = Date.now() - startTime;
    const status = response.status;
    
    // Save cookies for subsequent requests
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      cookies = setCookieHeader.split(', ');
    }
    
    console.log(`  Status: ${status} (${responseTime}ms)`);
    
    let responseData = null;
    
    if (response.status !== 204) { // No content
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
          if (VERBOSE || SAVE_RESPONSES) {
            console.log(`  Response data: ${formatResponse(responseData)}`);
          }
        } else {
          const text = await response.text();
          if (VERBOSE) {
            console.log(`  Response: ${text.substring(0, 150)}${text.length > 150 ? '...' : ''}`);
          }
        }
      } catch (parseError) {
        console.log(`  Could not parse response: ${parseError.message}`);
      }
    }
    
    if (status >= 400) {
      console.log(`  Error: ${responseData?.message || 'Unknown error'}`);
    }
    
    return {
      endpoint,
      method,
      status,
      success: status >= 200 && status < 300,
      requiresAuth,
      responseData,
      responseTime
    };
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return {
      endpoint,
      method,
      status: null,
      success: false,
      requiresAuth,
      error: error.message
    };
  }
}

/**
 * Authenticate with the API
 * @returns {Promise<boolean>} - Whether authentication was successful
 */
async function authenticate() {
  console.log('\n--- Authenticating ---');
  const auth = await testRoute('/api/login', 'POST', AUTH_CREDENTIALS);
  return auth.success;
}

/**
 * Run a test suite
 * @param {Array} tests - Tests to run
 * @returns {Promise<Array>} - Test results
 */
async function runTestSuite(tests) {
  const results = [];
  let authenticated = false;
  
  for (const test of tests) {
    // Authenticate if needed
    if (test.requiresAuth && !authenticated && BASIC_AUTH) {
      authenticated = await authenticate();
      if (!authenticated) {
        console.log('Authentication failed. Skipping authenticated tests.');
      }
    }
    
    // Skip auth tests if authentication failed
    if (test.requiresAuth && !authenticated && BASIC_AUTH) {
      console.log(`Skipping ${test.method} ${test.route} (requires authentication)`);
      results.push({
        ...test,
        status: 'SKIPPED',
        success: false
      });
      continue;
    }
    
    // Run the test
    const result = await testRoute(test.route, test.method, test.body, test.requiresAuth);
    results.push({
      ...test,
      ...result
    });
  }
  
  return results;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('=== CircleTube API Test Suite ===');
  console.log(`Base URL: ${API_BASE}`);
  console.log('Running tests...\n');
  
  // Define test groups
  const testGroups = {
    health: [
      { name: 'Health Check', route: '/api/health', method: 'GET', requiresAuth: false }
    ],
    auth: [
      { name: 'Login', route: '/api/login', method: 'POST', body: AUTH_CREDENTIALS, requiresAuth: false },
      { name: 'Register', route: '/api/register', method: 'POST', body: { username: 'newuser', password: 'newpassword' }, requiresAuth: false },
      { name: 'Get Current User', route: '/api/user', method: 'GET', requiresAuth: true }
    ],
    followers: [
      { name: 'Get Followers', route: '/api/followers', method: 'GET', requiresAuth: true },
      { name: 'Create Follower', route: '/api/followers', method: 'POST', body: { name: 'TestBot', personality: 'helpful' }, requiresAuth: true },
      { name: 'Get Follower', route: '/api/followers/1', method: 'GET', requiresAuth: true },
      { name: 'Update Follower', route: '/api/followers/1', method: 'PATCH', body: { name: 'UpdatedBot' }, requiresAuth: true }
    ],
    posts: [
      { name: 'Get Posts', route: '/api/posts', method: 'GET', requiresAuth: true },
      { name: 'Create Post', route: '/api/posts', method: 'POST', body: { content: 'Test post from API test suite' }, requiresAuth: true },
      { name: 'Get Post', route: '/api/posts/1', method: 'GET', requiresAuth: true },
      { name: 'Reply to Post', route: '/api/posts/1/reply', method: 'POST', body: { content: 'Test reply', parentId: 1 }, requiresAuth: true }
    ],
    circles: [
      { name: 'Get Circles', route: '/api/circles', method: 'GET', requiresAuth: true },
      { name: 'Create Circle', route: '/api/circles', method: 'POST', body: { name: 'Test Circle', description: 'Created by test suite' }, requiresAuth: true },
      { name: 'Get Circle', route: '/api/circles/1', method: 'GET', requiresAuth: true },
      { name: 'Update Circle', route: '/api/circles/1', method: 'PATCH', body: { name: 'Updated Circle' }, requiresAuth: true },
      { name: 'Get Circle Members', route: '/api/circles/1/members', method: 'GET', requiresAuth: true }
    ],
    labs: [
      { name: 'Get Labs', route: '/api/labs', method: 'GET', requiresAuth: true },
      { name: 'Create Lab', route: '/api/labs', method: 'POST', body: { name: 'Test Lab', experimentType: 'a/b test' }, requiresAuth: true },
      { name: 'Get Lab', route: '/api/labs/1', method: 'GET', requiresAuth: true }
    ]
  };
  
  // Flatten all tests into one array
  const allTests = Object.values(testGroups).flat();
  
  // Get test groups to run from command line arguments
  let testsToRun = allTests;
  const requestedGroups = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
  
  if (requestedGroups.length > 0) {
    testsToRun = [];
    requestedGroups.forEach(group => {
      if (testGroups[group]) {
        testsToRun.push(...testGroups[group]);
      } else {
        console.log(`Unknown test group: ${group}`);
      }
    });
  }
  
  // Run tests
  const results = await runTestSuite(testsToRun);
  
  // Print summary
  console.log('\n=== Test Results ===');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  
  console.log(`Total: ${results.length} | Passed: ${successful} | Failed: ${failed} | Skipped: ${skipped}`);
  
  // Print failures
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.success && r.status !== 'SKIPPED').forEach(test => {
      console.log(`- ${test.method} ${test.route}: ${test.status || 'ERROR'}`);
    });
  }
  
  // Print response time stats
  const responseTimes = results
    .filter(r => r.responseTime)
    .map(r => ({ name: r.name, time: r.responseTime }));
    
  if (responseTimes.length > 0) {
    console.log('\nResponse Time Stats:');
    console.log('Average: ' + Math.round(responseTimes.reduce((acc, curr) => acc + curr.time, 0) / responseTimes.length) + 'ms');
    console.log('Max: ' + Math.max(...responseTimes.map(r => r.time)) + 'ms');
    console.log('Min: ' + Math.min(...responseTimes.map(r => r.time)) + 'ms');
  }
}

runTests().catch(console.error);