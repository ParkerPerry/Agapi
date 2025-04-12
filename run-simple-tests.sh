#!/bin/bash

# CircleTube Test Runner
echo "====================================="
echo "🧪 Running CircleTube Essential Tests"
echo "====================================="
echo "Note: Tests will use port 5000 for API connections"
echo ""

# Run essential test files using the minimal configuration
# This avoids complex setup but ensures critical functionality is validated
echo "🔄 Running authentication tests..."
npx jest auth-endpoints.test.cjs --config jest.minimal.config.cjs

echo ""
echo "🔄 Running data creation tests..."
npx jest data-creation.test.cjs --config jest.minimal.config.cjs

echo ""
echo "🔄 Running circle operations tests..."
npx jest circles-api.test.cjs --config jest.minimal.config.cjs

echo ""
echo "🔄 Running AI follower tests..."
npx jest followers-api.test.cjs --config jest.minimal.config.cjs

echo ""
echo "🔄 Running essential workflow test..."
npx jest workflow.test.cjs -t "Update profile" --config jest.minimal.config.cjs

echo ""
echo "✅ Essential tests completed."
echo "For more comprehensive testing, run individual test files directly:"
echo "npx jest workflow.test.cjs --config jest.minimal.config.cjs"