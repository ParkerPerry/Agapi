#!/bin/bash

# Simple script to run tests with different options
# Usage: ./run-tests.sh [option]
# Options:
#   all         - Run all tests
#   unit        - Run only unit tests
#   integration - Run only integration tests
#   auth        - Run only authentication tests
#   followers   - Run only follower tests
#   posts       - Run only posts tests
#   circles     - Run only circle tests
#   coverage    - Run tests with coverage

# Set default test command
TEST_CMD="jest"

# Parse arguments
case "$1" in
  all)
    echo "Running all tests..."
    ;;
  unit)
    echo "Running unit tests..."
    TEST_CMD="jest --testPathPattern=unit"
    ;;
  integration)
    echo "Running integration tests..."
    TEST_CMD="jest --testPathPattern=integration"
    ;;
  auth)
    echo "Running authentication tests..."
    TEST_CMD="jest --testPathPattern=integration/auth"
    ;;
  followers)
    echo "Running follower tests..."
    TEST_CMD="jest --testPathPattern=integration/followers"
    ;;
  posts)
    echo "Running posts tests..."
    TEST_CMD="jest --testPathPattern=integration/posts"
    ;;
  circles)
    echo "Running circle tests..."
    TEST_CMD="jest --testPathPattern=integration/circles"
    ;;
  coverage)
    echo "Running tests with coverage..."
    TEST_CMD="jest --coverage"
    ;;
  *)
    echo "Running all tests..."
    ;;
esac

# Run the tests
$TEST_CMD