#!/bin/bash

echo "=============================================="
echo "🧪 Running CircleTube COMPREHENSIVE Test Suite"
echo "=============================================="
echo "Note: This will run ALL tests, starting with essential tests"
echo ""

# Check if we're in the project root or tests directory
if [ -d "api" ]; then
  # We're in the tests directory
  cd ..
  echo "Detected running from tests directory, changing to project root for consistency"
  SIMPLE_TESTS="./tests/run-simple-tests.sh"
else
  # We're in the project root
  SIMPLE_TESTS="./tests/run-simple-tests.sh"
fi

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

# Run all test files not covered by the simple tests
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
echo "🔄 Running full workflow tests (may take a few minutes)..."
npx jest tests/api/workflow.test.cjs --config jest.config.cjs

echo ""
echo "🔄 Running auth helper tests..."
npx jest tests/api/auth-helper.test.cjs --config jest.config.cjs

echo ""
echo "🔄 Running circle-follower integration tests..."
npx jest tests/api/circle-follower-api.test.cjs --config jest.config.cjs

echo ""
echo "🔄 Running follower collectives tests..."
npx jest tests/api/follower-collectives-api.test.cjs --config jest.config.cjs

echo ""
echo "🔄 Running tools API tests..."
npx jest tests/api/tools-api.test.cjs --config jest.config.cjs

echo ""
echo "🔄 Running direct chat API tests..."
npx jest tests/api/direct-chat-api.test.cjs --config jest.config.cjs

# Add a summary section
echo ""
echo "=============================================="
echo "✅ CircleTube Comprehensive Test Suite Complete"
echo "=============================================="
echo ""
echo "If all tests passed, the CircleTube API is fully functional."
echo ""
echo "For more targeted testing, run individual test files directly:"
echo "npx jest tests/api/workflow.test.cjs --config jest.config.cjs"