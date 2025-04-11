/**
 * Test runner script for running specific tests with detailed output
 * This is a more user-friendly alternative to calling Jest directly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const testPath = args.length > 0 ? args[0] : null;
const watchMode = args.includes('--watch');
const coverageMode = args.includes('--coverage');
const verboseMode = args.includes('--verbose');
const debugMode = args.includes('--debug');

/**
 * Find test files matching a pattern
 * @param {string} pattern - Pattern to match
 * @returns {Array<string>} - Matching files
 */
function findTestFiles(pattern) {
  const results = [];
  
  if (!pattern) {
    return ['server/test'];
  }
  
  // Check if pattern is a direct file path
  if (fs.existsSync(pattern) && fs.statSync(pattern).isFile()) {
    return [pattern];
  }
  
  // Otherwise, search for matching files
  searchDir('server/test', pattern, results);
  
  return results;
}

/**
 * Recursively search a directory for test files
 * @param {string} dir - Directory to search
 * @param {string} pattern - Pattern to match
 * @param {Array<string>} results - Results array to populate
 */
function searchDir(dir, pattern, results) {
  if (!fs.existsSync(dir)) {
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      searchDir(fullPath, pattern, results);
    } else if (
      file.includes('.test.') || 
      file.includes('.spec.') || 
      file.includes('__tests__')
    ) {
      if (fullPath.includes(pattern)) {
        results.push(fullPath);
      }
    }
  }
}

/**
 * Build the Jest command to run
 * @returns {string} - Jest command
 */
function buildJestCommand() {
  const files = findTestFiles(testPath);
  
  if (files.length === 0) {
    console.log(`${colors.red}No test files found matching: ${testPath}${colors.reset}`);
    process.exit(1);
  }
  
  let cmd = 'npx jest';
  
  if (files.length === 1) {
    cmd += ` ${files[0]}`;
  } else {
    console.log(`${colors.yellow}Running tests in multiple files:${colors.reset}`);
    files.forEach(file => console.log(`  - ${file}`));
    cmd += ` ${files.join(' ')}`;
  }
  
  if (watchMode) {
    cmd += ' --watch';
  }
  
  if (coverageMode) {
    cmd += ' --coverage';
  }
  
  if (verboseMode) {
    cmd += ' --verbose';
  }
  
  if (debugMode) {
    cmd += ' --runInBand --detectOpenHandles';
  }
  
  return cmd;
}

// Print header
console.log('\n' + 
  `${colors.bright}${colors.blue}===============================${colors.reset}\n` +
  `${colors.bright}${colors.blue}    CircleTube Test Runner    ${colors.reset}\n` +
  `${colors.bright}${colors.blue}===============================${colors.reset}\n`
);

// Show what we're running
const jestCommand = buildJestCommand();
console.log(`${colors.cyan}Running: ${jestCommand}${colors.reset}\n`);

// Run the tests
try {
  execSync(jestCommand, { stdio: 'inherit' });
  console.log(`\n${colors.green}${colors.bright}Tests completed successfully!${colors.reset}\n`);
} catch (error) {
  console.log(`\n${colors.red}${colors.bright}Tests failed!${colors.reset}\n`);
  if (debugMode) {
    console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
  }
  process.exit(1);
}