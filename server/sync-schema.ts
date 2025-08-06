import dotenv from 'dotenv';
dotenv.config();

import { db } from './db';
import { sql } from 'drizzle-orm';

async function syncSchema() {
  try {
    console.log('Syncing database schema to match local source of truth...');
    
    // Fix personality column in ai_follower_collectives to be NOT NULL
    console.log('Fixing ai_follower_collectives.personality column...');
    await db.execute(sql`
      -- First, update any NULL values to empty string
      UPDATE ai_follower_collectives 
      SET personality = 'Default personality' 
      WHERE personality IS NULL;
      
      -- Then make the column NOT NULL
      ALTER TABLE ai_follower_collectives 
      ALTER COLUMN personality SET NOT NULL;
    `);
    
    // Remove any extra tables that shouldn't exist
    console.log('Checking for extra tables...');
    await db.execute(sql`
      -- Drop tables that exist in Heroku but not in local
      DROP TABLE IF EXISTS collectives CASCADE;
      DROP TABLE IF EXISTS interactions CASCADE;
      DROP TABLE IF EXISTS direct_chat_messages CASCADE;
    `);
    
    // Ensure all required columns exist with correct constraints
    console.log('Ensuring all required columns exist...');
    await db.execute(sql`
      -- Add missing columns to ai_followers table if they don't exist
      ALTER TABLE ai_followers 
      ADD COLUMN IF NOT EXISTS response_delay JSON NOT NULL DEFAULT '{"min": 1, "max": 60}',
      ADD COLUMN IF NOT EXISTS response_chance INTEGER NOT NULL DEFAULT 80,
      ADD COLUMN IF NOT EXISTS tools JSON,
      ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES ai_followers(id),
      ADD COLUMN IF NOT EXISTS interests TEXT[],
      ADD COLUMN IF NOT EXISTS communication_style TEXT,
      ADD COLUMN IF NOT EXISTS interaction_preferences JSON;
      
      -- Add missing columns to pending_responses table
      ALTER TABLE pending_responses 
      ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS metadata TEXT;
      
      -- Add missing columns to notifications table
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS metadata JSON;
      
      -- Add missing columns to ai_interactions table
      ALTER TABLE ai_interactions 
      ADD COLUMN IF NOT EXISTS tools_used JSON;
      
      -- Add missing columns to direct_chats table
      ALTER TABLE direct_chats 
      ADD COLUMN IF NOT EXISTS tools_used JSON;
      
      -- Add missing columns to labs table
      ALTER TABLE labs 
      ADD COLUMN IF NOT EXISTS circle_id INTEGER REFERENCES circles(id),
      ADD COLUMN IF NOT EXISTS goals TEXT,
      ADD COLUMN IF NOT EXISTS hypothesis TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
      
      -- Add missing columns to ai_follower_collectives table
      ALTER TABLE ai_follower_collectives 
      ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
      
      -- Add missing columns to circle_members table
      ALTER TABLE circle_members 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL;
    `);
    
    // Verify the schema is now correct
    console.log('Verifying schema...');
    const result = await db.execute(sql`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    console.log(`Database now has ${result[0].table_count} tables`);
    console.log('Schema sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing schema:', error);
    process.exit(1);
  }
}

syncSchema();