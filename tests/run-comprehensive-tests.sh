#!/bin/bash

echo "=============================================="
echo "🧪 Running CircleTube COMPREHENSIVE Test Suite"
echo "=============================================="
echo "Note: This will run ALL tests, starting with essential tests"
echo ""

# Check if we're in the project root or tests directory
if [ -d "tests/api" ]; then
  # We're in the project root
  NODE_SCRIPT="node tests/run-test.js"
  SIMPLE_TESTS="./tests/run-simple-tests.sh"
  PREFIX="api/"
else
  # We're in the tests directory
  NODE_SCRIPT="node run-test.js"
  SIMPLE_TESTS="./run-simple-tests.sh"
  PREFIX="api/"
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

# Find all remaining test files that weren't explicitly included in the simple tests
# This approach ensures we don't miss any test files added in the future
echo "🔄 Running posts API tests..."
$NODE_SCRIPT ${PREFIX}posts-api.test.cjs

echo ""
echo "🔄 Running schema validation tests..."
$NODE_SCRIPT ${PREFIX}schema.test.cjs

echo ""
echo "🔄 Running server API tests..."
$NODE_SCRIPT ${PREFIX}server-api.test.cjs

echo ""
echo "🔄 Running simple verification tests..."
$NODE_SCRIPT ${PREFIX}simple.test.cjs

echo ""
echo "🔄 Running full workflow tests (may take a few minutes)..."
$NODE_SCRIPT ${PREFIX}workflow.test.cjs

echo ""
echo "🔄 Running auth helper tests..."
$NODE_SCRIPT ${PREFIX}auth-helper.test.cjs

# Add a summary section
echo ""
echo "=============================================="
echo "✅ CircleTube Comprehensive Test Suite Complete"
echo "=============================================="
echo ""
echo "If all tests passed, the CircleTube API is fully functional."
echo ""
echo "For more targeted testing, run individual test files directly:"
echo "node tests/run-test.js api/workflow.test.cjs"