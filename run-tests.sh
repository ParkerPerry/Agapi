#!/bin/bash

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# Flags
COVERAGE=false
VERBOSE=false
WATCH=false
GROUP=""
TEST_FILE=""
TEST_NAME=""
UPDATE_SNAPSHOTS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -c|--coverage)
      COVERAGE=true
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -w|--watch)
      WATCH=true
      shift
      ;;
    -g|--group)
      GROUP="$2"
      shift
      shift
      ;;
    -f|--file)
      TEST_FILE="$2"
      shift
      shift
      ;;
    -t|--test)
      TEST_NAME="$2"
      shift
      shift
      ;;
    -u|--update-snapshots)
      UPDATE_SNAPSHOTS=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [-c|--coverage] [-v|--verbose] [-w|--watch] [-g|--group GROUP] [-f|--file FILE] [-t|--test TEST_NAME] [-u|--update-snapshots]"
      exit 1
      ;;
  esac
done

# Build Jest command
JEST_CMD="npx jest --config=jest.config.ts"

# Add group filter
if [[ -n "$GROUP" ]]; then
  JEST_CMD="$JEST_CMD -t $GROUP"
fi

# Add test name filter
if [[ -n "$TEST_NAME" ]]; then
  JEST_CMD="$JEST_CMD -t '$TEST_NAME'"
fi

# Add file filter
if [[ -n "$TEST_FILE" ]]; then
  JEST_CMD="$JEST_CMD $TEST_FILE"
fi

# Add options
if $COVERAGE; then
  JEST_CMD="$JEST_CMD --coverage"
fi

if $VERBOSE; then
  JEST_CMD="$JEST_CMD --verbose"
fi

if $WATCH; then
  JEST_CMD="$JEST_CMD --watch"
fi

if $UPDATE_SNAPSHOTS; then
  JEST_CMD="$JEST_CMD --updateSnapshot"
fi

# Add colors
JEST_CMD="$JEST_CMD --colors"

# Display command
echo -e "${CYAN}Running: ${BLUE}$JEST_CMD${NC}"

# Execute command
eval $JEST_CMD

# Get exit status
STATUS=$?

# Display result
if [ $STATUS -eq 0 ]; then
  echo -e "${GREEN}Tests completed successfully!${NC}"
else
  echo -e "${RED}Tests failed with exit code $STATUS${NC}"
fi

exit $STATUS