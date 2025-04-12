#!/bin/bash

echo "====================================="
echo "🧪 Running CircleTube Essential Tests"
echo "====================================="
echo "Note: Tests will use port 5000 for API connections"
echo ""

# Check if we're in the project root or tests directory
if [ -d "api" ]; then
  # We're in the tests directory
  cd ..
  echo "Detected running from tests directory, changing to project root for consistency"
fi

# From project root, use a clear, direct approach with explicit config selection
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
echo "✅ Essential tests completed."
echo "For more comprehensive testing, run individual test files directly:"
echo "npx jest tests/api/posts-api.test.cjs --config jest.config.cjs"