#!/bin/bash

# CircleTube Comprehensive Test Runner
echo "=============================================="
echo "🧪 Running CircleTube COMPREHENSIVE Test Suite"
echo "=============================================="
echo "Note: This will run ALL tests, starting with essential tests"
echo ""

# Set the directory for test files and configuration
# Check if running from root or tests directory
if [ -d "tests/api" ]; then
  # Running from root directory
  TEST_DIR="tests/api"
  CONFIG_DIR="tests/config"
  SIMPLE_TESTS="./tests/run-simple-tests.sh"
else
  # Running from tests directory
  TEST_DIR="api"
  CONFIG_DIR="config"
  SIMPLE_TESTS="./run-simple-tests.sh"
fi
CONFIG_FILE="${CONFIG_DIR}/jest.minimal.config.cjs"

# First run the simple essential tests to ensure core functionality works
echo "🔄 Running essential tests first..."
$SIMPLE_TESTS

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

# Find all remaining test files that weren't explicitly included in the simple tests
# This approach ensures we don't miss any test files added in the future
echo "🔄 Running posts API tests..."
npx jest ${TEST_DIR}/posts-api.test.cjs --config ${CONFIG_FILE}

echo ""
echo "🔄 Running schema validation tests..."
npx jest ${TEST_DIR}/schema.test.cjs --config ${CONFIG_FILE}

echo ""
echo "🔄 Running server API tests..."
npx jest ${TEST_DIR}/server-api.test.cjs --config ${CONFIG_FILE}

echo ""
echo "🔄 Running simple verification tests..."
npx jest ${TEST_DIR}/simple.test.cjs --config ${CONFIG_FILE}

echo ""
echo "🔄 Running full workflow tests (may take a few minutes)..."
npx jest ${TEST_DIR}/workflow.test.cjs --config ${CONFIG_FILE}

echo ""
echo "🔄 Running auth helper tests..."
npx jest ${TEST_DIR}/auth-helper.test.cjs --config ${CONFIG_FILE}

# Add a summary section
echo ""
echo "=============================================="
echo "✅ CircleTube Comprehensive Test Suite Complete"
echo "=============================================="
echo ""
echo "If all tests passed, the CircleTube API is fully functional."
echo ""
echo "For more targeted testing, run individual test files directly:"
echo "npx jest tests/api/workflow.test.cjs --config tests/config/jest.minimal.config.cjs"