#!/bin/bash

echo "====================================="
echo "🧪 Running CircleTube Essential Tests"
echo "====================================="
echo "Note: Tests will use port 5000 for API connections"
echo ""

# Check if we're in the project root or tests directory
if [ -d "tests/api" ]; then
  # We're in the project root
  NODE_SCRIPT="node tests/run-test.cjs"
  PREFIX="api/"
else
  # We're in the tests directory
  NODE_SCRIPT="node run-test.js"
  PREFIX="api/"
fi

# Run essential test files using our utility script
echo "🔄 Running authentication tests..."
$NODE_SCRIPT ${PREFIX}auth-endpoints.test.cjs

echo ""
echo "🔄 Running data creation tests..."
$NODE_SCRIPT ${PREFIX}data-creation.test.cjs

echo ""
echo "🔄 Running circle operations tests..."
$NODE_SCRIPT ${PREFIX}circles-api.test.cjs

echo ""
echo "🔄 Running AI follower tests..."
$NODE_SCRIPT ${PREFIX}followers-api.test.cjs

echo ""
echo "🔄 Running essential workflow test..."
$NODE_SCRIPT ${PREFIX}workflow.test.cjs

echo ""
echo "✅ Essential tests completed."
echo "For more comprehensive testing, run individual test files directly:"
echo "node tests/run-test.js api/workflow.test.cjs"