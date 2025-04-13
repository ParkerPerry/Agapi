#!/bin/bash

echo "=============================================="
echo "🧪 Running CircleTube COMPREHENSIVE Test Suite"
echo "=============================================="
echo "Note: This will run ALL tests, providing detailed reporting"
echo ""

# IMPORTANT NOTES FOR TEST EXECUTION:
# 
# This script runs the ADVANCED test suite that verifies complete functionality.
# These tests should ONLY be run AFTER the simple/foundational tests pass.
#
# When running in Replit, this script may time out due to agent limitations.
# For targeted testing, use direct commands like:
#   npx jest tests/api/labs-api.test.cjs --config jest.comprehensive-report.config.cjs
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

# Choose between new consolidated mode and legacy mode
USE_CONSOLIDATED_TESTS=${USE_CONSOLIDATED_TESTS:-true}
RUN_SIMPLE_TESTS_FIRST=${RUN_SIMPLE_TESTS_FIRST:-false}

# If requested, run simple tests first to validate core functionality
if [ "$RUN_SIMPLE_TESTS_FIRST" = true ]; then
  echo "🔄 Running essential tests first..."
  ./tests/run-simple-tests.sh
  
  # Capture the exit code from simple tests
  SIMPLE_TESTS_EXIT_CODE=$?
  
  # If simple tests failed, exit early
  if [ $SIMPLE_TESTS_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ Essential tests failed. Stopping comprehensive testing."
    echo "Fix the essential tests before running comprehensive tests."
    exit $SIMPLE_TESTS_EXIT_CODE
  fi
  
  echo ""
  echo "✅ Essential tests passed. Continuing with additional tests..."
  echo ""
fi

if [ "$USE_CONSOLIDATED_TESTS" = true ]; then
  # Run all tests at once using the reporting config
  echo "🔄 Running all comprehensive tests with consolidated reporting..."
  # Set a timeout to ensure process terminates even if tests hang
  npx jest --config jest.comprehensive-report.config.cjs --forceExit --detectOpenHandles
  
  TEST_EXIT_CODE=$?
  
  # Generate API trace reports regardless of test outcome
  echo "📊 Generating API trace reports..."
  
  # Generate main API trace report
  node generate-api-trace-report.cjs
  
  # Generate comprehensive API trace report
  cd tests && node -e "require('./api-trace-helper.cjs').generateTraceReport('comprehensive-api-trace')" && cd ..
  
  echo ""
  if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Comprehensive tests completed successfully."
    echo "Check the detailed HTML report at: ./test-reports/comprehensive-tests-report.html"
    echo "API trace report available at: ./test-reports/comprehensive-api-trace.html"
  else
    echo "❌ Some comprehensive tests failed."
    echo "Review the detailed HTML report at: ./test-reports/comprehensive-tests-report.html"
    echo "API trace report available at: ./test-reports/comprehensive-api-trace.html"
  fi
else
  # Legacy mode - run tests individually
  echo "Running tests individually (legacy mode)..."
  
  # Only run tests that aren't already part of simple tests if we ran them first
  if [ "$RUN_SIMPLE_TESTS_FIRST" = true ]; then
    echo "🔄 Running posts API tests..."
    npx jest tests/api/posts-api.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running schema validation tests..."
    npx jest tests/api/schema.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running server API tests..."
    npx jest tests/api/server-api.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running simple verification tests..."
    npx jest tests/api/simple.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running complete workflow tests (all tests, not just profile update)..."
    npx jest tests/api/workflow.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running auth helper tests..."
    npx jest tests/api/auth-helper.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running follower collectives tests..."
    npx jest tests/api/follower-collectives-api.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running health API tests..."
    npx jest tests/api/health-api.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running labs API tests..."
    npx jest tests/api/labs-api.test.cjs --config jest.config.cjs
  else
    # Run all tests if we didn't run simple tests first
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
    echo "🔄 Running workflow tests..."
    npx jest tests/api/workflow.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running tools API tests..."
    npx jest tests/api/tools-api.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running circle-follower integration tests..."
    npx jest tests/api/circle-follower-api.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running default circles tests..."
    npx jest tests/api/default-circle-api.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running posts API tests..."
    npx jest tests/api/posts-api.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running schema validation tests..."
    npx jest tests/api/schema.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running server API tests..."
    npx jest tests/api/server-api.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running simple verification tests..."
    npx jest tests/api/simple.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running auth helper tests..."
    npx jest tests/api/auth-helper.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running follower collectives tests..."
    npx jest tests/api/follower-collectives-api.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running health API tests..."
    npx jest tests/api/health-api.test.cjs --config jest.config.cjs
    
    echo ""
    echo "🔄 Running labs API tests..."
    npx jest tests/api/labs-api.test.cjs --config jest.config.cjs
  fi
fi

# If in legacy mode, also generate API trace report
if [ "$USE_CONSOLIDATED_TESTS" = false ]; then
  echo "📊 Generating API trace report..."
  node generate-api-trace-report.cjs
fi

# Add a summary section
echo ""
echo "=============================================="
echo "✅ CircleTube Comprehensive Test Suite Complete"
echo "=============================================="
echo ""
echo "Test Reports:"
echo "- HTML Test Report: ./test-reports/comprehensive-tests-report.html"
echo "- API Trace Report: ./test-reports/comprehensive-api-trace.html"
echo "- Test Reports Directory: ./test-reports/index.html"
echo ""
echo "For more targeted testing, run individual test files directly:"
echo "npx jest tests/api/specific-test-file.test.cjs --config jest.config.cjs"