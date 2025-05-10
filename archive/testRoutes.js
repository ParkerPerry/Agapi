import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testRoute(route, method = 'GET', body = null) {
  console.log(`Testing ${method} ${route}...`);
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE}${route}`, options);
    const status = response.status;
    console.log(`  Status: ${status}`);
    
    if (status === 200 || status === 201) {
      // For successful responses, try to parse the JSON
      try {
        const data = await response.json();
        console.log(`  Response data: ${JSON.stringify(data).substring(0, 100)}${JSON.stringify(data).length > 100 ? '...' : ''}`);
      } catch (parseError) {
        console.log(`  Could not parse response as JSON: ${parseError.message}`);
      }
    }
    
    return status;
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('=== Testing Routes ===');
  console.log('Note: Some routes may fail due to authentication requirements or missing data');
  
  // Test public health endpoints
  console.log('\n--- Testing Health Endpoints ---');
  await testRoute('/api/health');
  await testRoute('/api/health/details');
  
  // Test authenticated endpoints (will return 401 without auth)
  console.log('\n--- Testing Data Endpoints (Auth Required) ---');
  await testRoute('/api/circles');
  await testRoute('/api/followers');
  await testRoute('/api/labs');
  await testRoute('/api/posts');
  
  console.log('\nTests completed!');
}

runTests().catch(console.error);