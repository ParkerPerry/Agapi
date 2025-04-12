#!/bin/bash

# CircleTube Test Runner
echo "====================================="
echo "🧪 Running CircleTube Essential Tests"
echo "====================================="
echo "Note: Tests will use port 5000 for API connections"
echo ""

# Set the directory for test files and configuration
TEST_DIR="api"
CONFIG_DIR="config"

# Run essential test files using the minimal configuration
# This avoids complex setup but ensures critical functionality is validated
echo "🔄 Running authentication tests..."
npx jest ${TEST_DIR}/auth-endpoints.test.cjs --config ${CONFIG_DIR}/jest.minimal.config.cjs

echo ""
echo "🔄 Running data creation tests..."
npx jest ${TEST_DIR}/data-creation.test.cjs --config ${CONFIG_DIR}/jest.minimal.config.cjs

echo ""
echo "🔄 Running circle operations tests..."
npx jest ${TEST_DIR}/circles-api.test.cjs --config ${CONFIG_DIR}/jest.minimal.config.cjs

echo ""
echo "🔄 Running AI follower tests..."
npx jest ${TEST_DIR}/followers-api.test.cjs --config ${CONFIG_DIR}/jest.minimal.config.cjs

echo ""
echo "🔄 Running essential workflow test..."
npx jest ${TEST_DIR}/workflow.test.cjs -t "Update profile" --config ${CONFIG_DIR}/jest.minimal.config.cjs

echo ""
echo "✅ Essential tests completed."
echo "For more comprehensive testing, run individual test files directly:"
echo "npx jest tests/api/workflow.test.cjs --config tests/config/jest.minimal.config.cjs"