#!/bin/bash

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Jest command with our minimal config
JEST_CMD="npx jest --config=jest.minimal.config.cjs"

echo -e "${BLUE}Running simple math tests...${NC}"
$JEST_CMD simple.test.cjs
SIMPLE_RESULT=$?

echo -e "${BLUE}Running schema validation tests...${NC}"
$JEST_CMD schema.test.cjs
SCHEMA_RESULT=$?

echo -e "${BLUE}Running API tests against server...${NC}"
$JEST_CMD server-api.test.cjs
API_RESULT=$?

echo -e "${BLUE}Running followers API tests...${NC}"
$JEST_CMD followers-api.test.cjs
FOLLOWERS_RESULT=$?

echo -e "${BLUE}Running posts API tests...${NC}"
$JEST_CMD posts-api.test.cjs
POSTS_RESULT=$?

echo -e "${BLUE}Running circles API tests...${NC}"
$JEST_CMD circles-api.test.cjs
CIRCLES_RESULT=$?

echo -e "${BLUE}Running authentication tests...${NC}"
$JEST_CMD auth-endpoints.test.cjs
AUTH_RESULT=$?

# Display results summary
echo ""
echo -e "${YELLOW}=== Test Results Summary ===${NC}"

if [ $SIMPLE_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ Simple math tests: PASSED${NC}"
else
  echo -e "${RED}✗ Simple math tests: FAILED${NC}"
fi

if [ $SCHEMA_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ Schema validation tests: PASSED${NC}"
else
  echo -e "${RED}✗ Schema validation tests: FAILED${NC}"
fi

if [ $API_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ API tests: PASSED${NC}"
else
  echo -e "${RED}✗ API tests: FAILED${NC}"
fi

if [ $FOLLOWERS_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ Followers API tests: PASSED${NC}"
else
  echo -e "${RED}✗ Followers API tests: FAILED${NC}"
fi

if [ $POSTS_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ Posts API tests: PASSED${NC}"
else
  echo -e "${RED}✗ Posts API tests: FAILED${NC}"
fi

if [ $CIRCLES_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ Circles API tests: PASSED${NC}"
else
  echo -e "${RED}✗ Circles API tests: FAILED${NC}"
fi

if [ $AUTH_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ Authentication tests: PASSED${NC}"
else
  echo -e "${RED}✗ Authentication tests: FAILED${NC}"
fi

# Overall result
if [ $SIMPLE_RESULT -eq 0 ] && [ $SCHEMA_RESULT -eq 0 ] && [ $API_RESULT -eq 0 ] && [ $FOLLOWERS_RESULT -eq 0 ] && [ $POSTS_RESULT -eq 0 ] && [ $CIRCLES_RESULT -eq 0 ] && [ $AUTH_RESULT -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi