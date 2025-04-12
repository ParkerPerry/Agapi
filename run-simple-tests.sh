#!/bin/bash

# Run simple math tests
echo "Running simple math tests..."
echo "Note: Tests will use port 5000 for API connections"

# Run the tests using the minimal configuration that avoids complex setup
npx jest auth-endpoints.test.cjs data-creation.test.cjs --config jest.minimal.config.cjs

echo "Simple tests completed."