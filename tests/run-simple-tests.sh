#!/bin/bash

echo "====================================="
echo "🧪 Running CircleTube Essential Tests"
echo "====================================="
echo "Note: Tests will use port 5000 for API connections"
echo ""

# IMPORTANT NOTES FOR TEST EXECUTION:
# 
# This script runs the FOUNDATIONAL test suite that verifies critical functionality.
# These tests should pass before attempting comprehensive tests.
#
# When running in Replit, this script may time out due to agent limitations.
# For targeted testing, use direct commands like:
#   npx jest tests/api/auth-endpoints.test.cjs --config jest.simple-report.config.cjs
#
# See TEST-README.md for more detailed information on testing strategy.

# Check if we're in the project root or tests directory
if [ -d "api" ]; then
  # We're in the tests directory
  cd ..
  echo "Detected running from tests directory, changing to project root for consistency"
fi

# Create test reports directory if it doesn't exist
mkdir -p test-reports

# First, check if required reporter packages are installed
if ! npm list jest-html-reporters > /dev/null 2>&1 || ! npm list jest-junit > /dev/null 2>&1; then
  echo "Installing required reporter packages for test reporting..."
  npm install --save-dev jest-html-reporters jest-junit
fi

# Choose between old individual test mode and new consolidated mode
USE_CONSOLIDATED_TESTS=${USE_CONSOLIDATED_TESTS:-true}

if [ "$USE_CONSOLIDATED_TESTS" = true ]; then
  # Run all tests at once using the reporting config
  echo "🔄 Running all essential tests with consolidated reporting..."
  npx jest --config jest.simple-report.config.cjs
  
  TEST_EXIT_CODE=$?
  
  # If any specific test needs to be run with different parameters, run it here
  # For example, the workflow test with a specific test name:
  echo ""
  echo "🔄 Running essential workflow test..."
  npx jest tests/api/workflow.test.cjs -t "Update profile" --config jest.config.cjs

  echo ""
  if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Essential tests completed successfully."
    echo "Check the detailed HTML report at: ./test-reports/simple-tests-report.html"
  else
    echo "❌ Some essential tests failed."
    echo "Review the detailed HTML report at: ./test-reports/simple-tests-report.html"
  fi
else
  # Original individual test approach for backward compatibility
  echo "Running tests individually (legacy mode)..."
  
  echo "🔄 Running authentication tests..."
  npx jest tests/api/auth-endpoints.test.cjs --config jest.config.cjs

  echo ""
  echo "🔄 Running data creation tests..."
  npx jest tests/api/data-creation.test.cjs --config jest.config.cjs

  echo ""
  echo "🔄 Running circle operations tests..."
  npx jest tests/api/circles-api.test.cjs --config jest.config.cjs

  echo ""
  echo "🔄 Running AI follower tests..."
  npx jest tests/api/followers-api.test.cjs --config jest.config.cjs

  echo ""
  echo "🔄 Running essential workflow test..."
  npx jest tests/api/workflow.test.cjs -t "Update profile" --config jest.config.cjs

  echo ""
  echo "🔄 Running tools API tests..."
  npx jest tests/api/tools-api.test.cjs --config jest.config.cjs

  echo ""
  echo "🔄 Running circle-follower integration tests..."
  npx jest tests/api/circle-follower-api.test.cjs --config jest.config.cjs

  echo ""
  echo "🔄 Running default circles tests..."
  npx jest tests/api/default-circle-api.test.cjs --config jest.config.cjs
fi

echo ""
echo "For more comprehensive testing, run the comprehensive test suite:"
echo "./tests/run-comprehensive-tests.sh"