/**
 * Custom Jest reporter that provides a detailed summary after test execution
 */
export default class CustomReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.testResults = [];
    this.startTime = null;
  }

  onRunStart(results, options) {
    this.startTime = new Date();
    console.log('\n📊 Beginning test run...');
  }

  onTestResult(test, testResult, aggregatedResult) {
    // Store each test file's results
    const fileResult = {
      testFilePath: testResult.testFilePath,
      testFileName: testResult.testFilePath.split('/').pop(),
      numPassingTests: testResult.numPassingTests,
      numFailingTests: testResult.numFailingTests,
      numPendingTests: testResult.numPendingTests,
      numTodoTests: testResult.numTodoTests,
      testResults: testResult.testResults.map(result => ({
        ancestorTitles: result.ancestorTitles,
        title: result.title,
        status: result.status,
        duration: result.duration,
        failureMessages: result.failureMessages
      }))
    };
    
    this.testResults.push(fileResult);
  }

  onRunComplete(contexts, results) {
    const endTime = new Date();
    const duration = (endTime - this.startTime) / 1000;
    
    console.log('\n==============================================');
    console.log('📊 CIRCULETUBE API TEST SUMMARY REPORT');
    console.log('==============================================');
    console.log(`\nTest Run Completed in: ${duration.toFixed(2)} seconds`);
    console.log(`Date: ${endTime.toLocaleString()}`);
    console.log('\n📈 OVERALL RESULTS:');
    console.log(`Total Test Suites: ${results.numTotalTestSuites}`);
    console.log(`Total Tests: ${results.numTotalTests}`);
    console.log(`- Passed: ${results.numPassedTests} ✅`);
    console.log(`- Failed: ${results.numFailedTests} ${results.numFailedTests > 0 ? '❌' : ''}`);
    console.log(`- Pending: ${results.numPendingTests} ${results.numPendingTests > 0 ? '⏳' : ''}`);
    console.log(`- Todo: ${results.numTodoTests} ${results.numTodoTests > 0 ? '📝' : ''}`);

    // Show failed test files if any
    if (results.numFailedTests > 0) {
      console.log('\n❌ FAILED TEST FILES:');
      this.testResults
        .filter(file => file.numFailingTests > 0)
        .forEach(file => {
          console.log(`- ${file.testFileName} (${file.numFailingTests} failed tests)`);
          
          // List failed tests within the file
          file.testResults
            .filter(test => test.status === 'failed')
            .forEach(test => {
              const testPath = [...test.ancestorTitles, test.title].join(' › ');
              console.log(`  ❌ ${testPath}`);
              
              // Show abbreviated error message (first line only for brevity)
              if (test.failureMessages && test.failureMessages.length > 0) {
                const firstErrorLine = test.failureMessages[0].split('\n')[0];
                console.log(`     Error: ${firstErrorLine}`);
              }
            });
        });
    }

    // Show test coverage by API groups
    console.log('\n🔍 API GROUP COVERAGE:');
    
    const apiGroups = {
      'Authentication': /auth-endpoints\.test\.cjs$/,
      'User Data': /data-creation\.test\.cjs$/,
      'Circles': /circles-api\.test\.cjs$/,
      'Default Circles': /default-circle-api\.test\.cjs$/,
      'AI Followers': /followers-api\.test\.cjs$/,
      'Follower Collectives': /follower-collectives-api\.test\.cjs$/,
      'Circle-Follower Integration': /circle-follower-api\.test\.cjs$/,
      'Posts': /posts-api\.test\.cjs$/,
      'Tools': /tools-api\.test\.cjs$/,
      'Health': /health-api\.test\.cjs$/,
      'Labs': /labs-api\.test\.cjs$/,
      'Schema': /schema\.test\.cjs$/,
      'Server': /server-api\.test\.cjs$/,
      'Workflows': /workflow\.test\.cjs$/,
      'Other': /^.*$/
    };
    
    Object.entries(apiGroups).forEach(([groupName, regex]) => {
      const groupFiles = this.testResults.filter(file => regex.test(file.testFileName));
      
      if (groupFiles.length === 0 && groupName !== 'Other') {
        return; // Skip groups with no files
      }
      
      const totalTests = groupFiles.reduce((sum, file) => 
        sum + file.numPassingTests + file.numFailingTests + file.numPendingTests, 0);
      
      const passedTests = groupFiles.reduce((sum, file) => sum + file.numPassingTests, 0);
      const failedTests = groupFiles.reduce((sum, file) => sum + file.numFailingTests, 0);
      
      if (totalTests > 0) {
        const passRate = ((passedTests / totalTests) * 100).toFixed(1);
        const statusIcon = failedTests > 0 ? '⚠️' : '✅';
        
        console.log(`${statusIcon} ${groupName}: ${passedTests}/${totalTests} (${passRate}%) tests passed`);
      }
    });

    console.log('\n==============================================');
    console.log('📊 END OF TEST SUMMARY');
    console.log('==============================================');
    
    if (results.numFailedTests > 0) {
      console.log('\n❌ Some tests have failed. Please review the detailed report.');
      console.log('   HTML Report: ./test-reports/[simple|comprehensive]-tests-report.html');
    } else {
      console.log('\n✅ All tests have passed successfully!');
    }
  }
}