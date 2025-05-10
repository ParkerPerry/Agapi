/**
 * Test runner script that works properly regardless of current working directory
 * To use: node tests/run-test.cjs <test-file-path>
 * Example: node tests/run-test.cjs api/posts-api.test.cjs
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function runTest() {
  // Get the test file from command line arguments
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Error: Please specify a test file path');
    console.log('Usage: node run-test.cjs <test-file-path>');
    console.log('Example: node run-test.cjs api/posts-api.test.cjs');
    process.exit(1);
  }

  // The first argument should be the test file
  let testFile = args[0];
  
  // If we're running from project root, we need to adjust paths
  const isInProjectRoot = !process.cwd().endsWith('/tests');
  
  // If user passed 'tests/api/file.test.cjs' but we're already in tests directory, fix it
  if (testFile.startsWith('tests/') && isInProjectRoot) {
    // All good, keep as is
  } else if (testFile.startsWith('tests/') && !isInProjectRoot) {
    // We're in the tests directory but path includes 'tests/' prefix, so remove it
    testFile = testFile.replace('tests/', '');
  } else if (!testFile.startsWith('tests/') && isInProjectRoot) {
    // We're in project root but path doesn't include 'tests/' prefix, so add it
    testFile = `tests/${testFile}`;
  }
  
  // Find the config file
  let configFile;
  if (isInProjectRoot) {
    configFile = 'tests/config/jest.minimal.config.cjs';
  } else {
    configFile = 'config/jest.minimal.config.cjs';
  }
  
  // Check if config file exists
  if (!fs.existsSync(configFile)) {
    console.error(`Error: Config file "${configFile}" not found`);
    process.exit(1);
  }
  
  // Build the Jest command
  const jestCommand = `npx jest ${testFile} --config ${configFile}`;
  
  console.log(`Running test: ${testFile}`);
  console.log(`Command: ${jestCommand}`);
  
  try {
    // Execute the test with the specified config
    execSync(jestCommand, { stdio: 'inherit' });
  } catch (error) {
    console.error('Test execution failed with error:', error.message);
    process.exit(1);
  }
}

runTest();