/**
 * Test script for metrics analysis API endpoints
 */
import fetch from 'node-fetch';

async function testMetricsApi() {
  // Test analyze-metric endpoint
  console.log('Testing analyze-metric API endpoint...');
  try {
    const metricResponse = await fetch('http://localhost:5000/api/analyze-metric', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metric: {
          name: 'Engagement Rate',
          target: '15%',
          priority: 'high'
        },
        labGoals: 'Increase user engagement with posts',
        controlCircles: [{
          id: 1,
          name: 'Control Group',
          posts: [{
            content: 'This is a test post in the control group',
            createdAt: new Date().toISOString()
          }]
        }],
        treatmentCircles: [{
          id: 2,
          name: 'Treatment Group',
          posts: [{
            content: 'This is a test post in the treatment group with new features',
            createdAt: new Date().toISOString()
          }]
        }]
      })
    });

    if (!metricResponse.ok) {
      throw new Error(`HTTP error! status: ${metricResponse.status}`);
    }
    
    const metricData = await metricResponse.json();
    console.log('Analyze metric result:', JSON.stringify(metricData, null, 2));
    
    // Test analyze-recommendation endpoint
    console.log('\nTesting analyze-recommendation API endpoint...');
    const recommendationResponse = await fetch('http://localhost:5000/api/analyze-recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metrics: [
          {
            name: 'Engagement Rate',
            target: '15%',
            priority: 'high',
            actual: metricData.actual,
            status: metricData.status,
            confidence: metricData.confidence,
            difference: metricData.difference
          },
          {
            name: 'User Retention',
            target: '80%',
            priority: 'medium',
            actual: '82%',
            status: 'success',
            confidence: 90,
            difference: '+2%'
          }
        ],
        labStatus: 'active'
      })
    });

    if (!recommendationResponse.ok) {
      throw new Error(`HTTP error! status: ${recommendationResponse.status}`);
    }
    
    const recommendationData = await recommendationResponse.json();
    console.log('Analyze recommendation result:', JSON.stringify(recommendationData, null, 2));
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error testing metrics API:', error);
  }
}

testMetricsApi();