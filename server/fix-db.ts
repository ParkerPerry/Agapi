import dotenv from 'dotenv';
dotenv.config();

import { db } from './db';
import { sql } from 'drizzle-orm';

async function fixDatabase() {
  try {
    console.log('Fixing existing database tables...');
    
    // Add missing columns to existing tables
    await db.execute(sql`
      -- Add missing columns to ai_followers table
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
      ADD COLUMN IF NOT EXISTS personality TEXT;
      
      -- Add missing columns to circle_members table
      ALTER TABLE circle_members 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL;
    `);
    
    console.log('Database tables fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
}

fixDatabase(); 