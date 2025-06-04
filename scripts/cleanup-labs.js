#!/usr/bin/env node

/**
 * Lab Cleanup Script
 * 
 * This script safely deletes labs and all associated data while respecting
 * database foreign key constraints. It can delete all labs for a user or
 * specific labs by ID.
 * 
 * Usage:
 *   node scripts/cleanup-labs.js --user-id=1
 *   node scripts/cleanup-labs.js --lab-ids=11,22,33
 *   node scripts/cleanup-labs.js --user-id=1 --lab-ids=11,22 --dry-run
 * 
 * Options:
 *   --user-id      Delete all labs for this user ID
 *   --lab-ids      Comma-separated list of specific lab IDs to delete
 *   --dry-run      Show what would be deleted without actually deleting
 *   --help         Show this help message
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    userId: null,
    labIds: [],
    dryRun: false,
    help: false
  };

  for (const arg of args) {
    if (arg.startsWith('--user-id=')) {
      options.userId = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--lab-ids=')) {
      options.labIds = arg.split('=')[1].split(',').map(id => parseInt(id.trim()));
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help') {
      options.help = true;
    }
  }

  return options;
}

// Show help message
function showHelp() {
  console.log(`
Lab Cleanup Script

This script safely deletes labs and all associated data while respecting
database foreign key constraints.

Usage:
  node scripts/cleanup-labs.js --user-id=1
  node scripts/cleanup-labs.js --lab-ids=11,22,33
  node scripts/cleanup-labs.js --user-id=1 --lab-ids=11,22 --dry-run

Options:
  --user-id      Delete all labs for this user ID
  --lab-ids      Comma-separated list of specific lab IDs to delete
  --dry-run      Show what would be deleted without actually deleting
  --help         Show this help message

Examples:
  # Delete all labs for user ID 1
  node scripts/cleanup-labs.js --user-id=1

  # Delete specific labs by ID
  node scripts/cleanup-labs.js --lab-ids=11,22,33

  # Preview what would be deleted for user ID 1
  node scripts/cleanup-labs.js --user-id=1 --dry-run

  # Delete specific labs for a user (intersection)
  node scripts/cleanup-labs.js --user-id=1 --lab-ids=11,22
`);
}

// Get lab IDs to delete based on options
async function getLabIdsToDelete(options) {
  let labIds = [];

  if (options.userId && options.labIds.length > 0) {
    // Get intersection: labs that belong to user AND are in the specified list
    const result = await pool.query(
      'SELECT id FROM labs WHERE user_id = $1 AND id = ANY($2)',
      [options.userId, options.labIds]
    );
    labIds = result.rows.map(row => row.id);
  } else if (options.userId) {
    // Get all labs for user
    const result = await pool.query(
      'SELECT id FROM labs WHERE user_id = $1',
      [options.userId]
    );
    labIds = result.rows.map(row => row.id);
  } else if (options.labIds.length > 0) {
    // Use specific lab IDs
    labIds = options.labIds;
  }

  return labIds;
}

// Get detailed information about what will be deleted
async function getDeleteionStats(labIds) {
  if (labIds.length === 0) return null;

  const labIdsStr = labIds.join(',');
  
  // Get lab details
  const labsResult = await pool.query(
    `SELECT id, name, status, user_id, created_at 
     FROM labs 
     WHERE id = ANY($1) 
     ORDER BY created_at DESC`,
    [labIds]
  );

  // Get posts count
  const postsResult = await pool.query(
    `SELECT COUNT(*) as count 
     FROM posts 
     WHERE lab_id = ANY($1)`,
    [labIds]
  );

  // Get AI interactions count
  const interactionsResult = await pool.query(
    `SELECT COUNT(*) as count 
     FROM ai_interactions 
     WHERE post_id IN (
       SELECT id FROM posts WHERE lab_id = ANY($1)
     )`,
    [labIds]
  );

  // Get pending responses count
  const pendingResult = await pool.query(
    `SELECT COUNT(*) as count 
     FROM pending_responses 
     WHERE post_id IN (
       SELECT id FROM posts WHERE lab_id = ANY($1)
     )`,
    [labIds]
  );

  // Get lab content count
  const contentResult = await pool.query(
    `SELECT COUNT(*) as count 
     FROM lab_content 
     WHERE lab_id = ANY($1)`,
    [labIds]
  );

  // Get lab analysis results count
  const analysisResult = await pool.query(
    `SELECT COUNT(*) as count 
     FROM lab_analysis_results 
     WHERE lab_id = ANY($1)`,
    [labIds]
  );

  // Get lab circles count
  const circlesResult = await pool.query(
    `SELECT COUNT(*) as count 
     FROM lab_circles 
     WHERE lab_id = ANY($1)`,
    [labIds]
  );

  return {
    labs: labsResult.rows,
    counts: {
      labs: labsResult.rows.length,
      posts: parseInt(postsResult.rows[0].count),
      interactions: parseInt(interactionsResult.rows[0].count),
      pendingResponses: parseInt(pendingResult.rows[0].count),
      content: parseInt(contentResult.rows[0].count),
      analysisResults: parseInt(analysisResult.rows[0].count),
      circles: parseInt(circlesResult.rows[0].count)
    }
  };
}

// Perform the actual deletion
async function deleteLabs(labIds) {
  if (labIds.length === 0) {
    console.log('No labs to delete.');
    return;
  }

  console.log(`\nDeleting labs: ${labIds.join(', ')}`);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Step 1: Delete AI interactions
    console.log('1. Deleting AI interactions...');
    const interactionsResult = await client.query(
      `DELETE FROM ai_interactions 
       WHERE post_id IN (
         SELECT id FROM posts WHERE lab_id = ANY($1)
       )`,
      [labIds]
    );
    console.log(`   Deleted ${interactionsResult.rowCount} AI interactions`);

    // Step 2: Delete pending responses
    console.log('2. Deleting pending responses...');
    const pendingResult = await client.query(
      `DELETE FROM pending_responses 
       WHERE post_id IN (
         SELECT id FROM posts WHERE lab_id = ANY($1)
       )`,
      [labIds]
    );
    console.log(`   Deleted ${pendingResult.rowCount} pending responses`);

    // Step 3: Delete posts
    console.log('3. Deleting posts...');
    const postsResult = await client.query(
      'DELETE FROM posts WHERE lab_id = ANY($1)',
      [labIds]
    );
    console.log(`   Deleted ${postsResult.rowCount} posts`);

    // Step 4: Delete lab content
    console.log('4. Deleting lab content...');
    const contentResult = await client.query(
      'DELETE FROM lab_content WHERE lab_id = ANY($1)',
      [labIds]
    );
    console.log(`   Deleted ${contentResult.rowCount} lab content entries`);

    // Step 5: Delete lab analysis results
    console.log('5. Deleting lab analysis results...');
    const analysisResult = await client.query(
      'DELETE FROM lab_analysis_results WHERE lab_id = ANY($1)',
      [labIds]
    );
    console.log(`   Deleted ${analysisResult.rowCount} analysis results`);

    // Step 6: Delete lab circles
    console.log('6. Deleting lab circle associations...');
    const circlesResult = await client.query(
      'DELETE FROM lab_circles WHERE lab_id = ANY($1)',
      [labIds]
    );
    console.log(`   Deleted ${circlesResult.rowCount} circle associations`);

    // Step 7: Delete labs
    console.log('7. Deleting labs...');
    const labsResult = await client.query(
      'DELETE FROM labs WHERE id = ANY($1)',
      [labIds]
    );
    console.log(`   Deleted ${labsResult.rowCount} labs`);

    await client.query('COMMIT');
    console.log('\nCleanup completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\nError during cleanup:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Main function
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  if (!options.userId && options.labIds.length === 0) {
    console.error('Error: Must specify either --user-id or --lab-ids');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  try {
    // Get lab IDs to delete
    const labIds = await getLabIdsToDelete(options);
    
    if (labIds.length === 0) {
      console.log('No labs found matching the criteria.');
      return;
    }

    // Get deletion statistics
    const stats = await getDeleteionStats(labIds);
    
    // Show what will be deleted
    console.log('\nLabs to be deleted:');
    stats.labs.forEach(lab => {
      console.log(`  - ${lab.name} (ID: ${lab.id}, Status: ${lab.status}, User: ${lab.user_id})`);
    });

    console.log('\nAssociated data to be deleted:');
    console.log(`  - ${stats.counts.labs} labs`);
    console.log(`  - ${stats.counts.posts} posts`);
    console.log(`  - ${stats.counts.interactions} AI interactions`);
    console.log(`  - ${stats.counts.pendingResponses} pending responses`);
    console.log(`  - ${stats.counts.content} lab content entries`);
    console.log(`  - ${stats.counts.analysisResults} analysis results`);
    console.log(`  - ${stats.counts.circles} circle associations`);

    if (options.dryRun) {
      console.log('\nDRY RUN: No data was actually deleted.');
    } else {
      // Confirm deletion
      console.log('\nThis action cannot be undone!');
      
      // For safety, require explicit confirmation
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('Type "CONFIRM" to proceed with deletion: ', resolve);
      });
      rl.close();

      if (answer !== 'CONFIRM') {
        console.log('Deletion cancelled.');
        return;
      }

      // Perform deletion
      await deleteLabs(labIds);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});