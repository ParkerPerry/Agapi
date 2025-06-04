# Lab Cleanup Script

A parameterized script for safely deleting labs and all associated data while respecting database foreign key constraints.

## Features

- Delete all labs for a specific user
- Delete specific labs by ID
- Dry-run mode to preview deletions
- Transaction-based deletion with rollback on errors
- Detailed statistics about what will be deleted
- Safety confirmation prompt

## Usage

### Delete all labs for a user
```bash
node scripts/cleanup-labs.js --user-id=1
```

### Delete specific labs by ID
```bash
node scripts/cleanup-labs.js --lab-ids=11,22,33
```

### Preview what would be deleted (dry run)
```bash
node scripts/cleanup-labs.js --user-id=1 --dry-run
```

### Delete specific labs for a user (intersection)
```bash
node scripts/cleanup-labs.js --user-id=1 --lab-ids=11,22
```

## Options

- `--user-id` - Delete all labs for this user ID
- `--lab-ids` - Comma-separated list of specific lab IDs to delete
- `--dry-run` - Show what would be deleted without actually deleting
- `--help` - Show help message

## What Gets Deleted

The script handles the following data in the correct order to respect foreign key constraints:

1. **AI Interactions** - Comments, replies, and likes from AI followers
2. **Pending Responses** - Scheduled AI responses
3. **Posts** - Lab experiment posts
4. **Lab Content** - Content templates and variants
5. **Lab Analysis Results** - Experiment metrics and analysis data
6. **Lab Circle Associations** - Which circles the labs are connected to
7. **Labs** - The lab records themselves

## Safety Features

- **Transaction Safety**: All deletions happen in a single database transaction that rolls back on any error
- **Confirmation Prompt**: Requires typing "CONFIRM" before proceeding with actual deletions
- **Dry Run Mode**: Preview exactly what will be deleted before committing
- **Detailed Reporting**: Shows counts of all related data that will be affected

## Examples

```bash
# Preview deletion for user 1
node scripts/cleanup-labs.js --user-id=1 --dry-run

# Delete all test labs for user 1
node scripts/cleanup-labs.js --user-id=1

# Delete only specific problematic labs
node scripts/cleanup-labs.js --lab-ids=230,229,228

# Delete specific labs but only if they belong to user 1
node scripts/cleanup-labs.js --user-id=1 --lab-ids=230,229,228
```

## Environment

The script uses the `DATABASE_URL` environment variable from your `.env` file to connect to the database.