import dotenv from 'dotenv';
dotenv.config();

import { db } from './db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');
    
    // Create tables using Drizzle's migrate function
    // This will create all tables defined in the schema
    await migrate(db, { migrationsFolder: './migrations' });
    
    console.log('Database tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    
    // Fallback: try to create tables manually using SQL
    try {
      console.log('Trying fallback method...');
      const client = await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          avatar_url TEXT,
          bio TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS circles (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          color TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          user_id INTEGER REFERENCES users(id) NOT NULL,
          is_default BOOLEAN DEFAULT FALSE NOT NULL,
          visibility TEXT DEFAULT 'private' NOT NULL,
          added_at TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS circle_members (
          id SERIAL PRIMARY KEY,
          circle_id INTEGER REFERENCES circles(id) NOT NULL,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          role TEXT NOT NULL,
          status TEXT DEFAULT 'active' NOT NULL,
          joined_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS circle_invitations (
          id SERIAL PRIMARY KEY,
          circle_id INTEGER REFERENCES circles(id) NOT NULL,
          inviter_id INTEGER REFERENCES users(id) NOT NULL,
          invitee_id INTEGER REFERENCES users(id) NOT NULL,
          role TEXT NOT NULL,
          status TEXT DEFAULT 'pending' NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          responded_at TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          circle_id INTEGER REFERENCES circles(id),
          lab_id INTEGER,
          lab_experiment BOOLEAN DEFAULT FALSE,
          target_role TEXT,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS ai_followers (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          name TEXT NOT NULL,
          personality TEXT NOT NULL,
          avatar_url TEXT NOT NULL,
          background TEXT,
          interests TEXT[],
          communication_style TEXT,
          interaction_preferences JSON,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          responsiveness TEXT NOT NULL DEFAULT 'active',
          response_delay JSON NOT NULL DEFAULT '{"min": 1, "max": 60}',
          response_chance INTEGER NOT NULL DEFAULT 80,
          tools JSON,
          parent_id INTEGER REFERENCES ai_followers(id),
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS circle_followers (
          id SERIAL PRIMARY KEY,
          circle_id INTEGER REFERENCES circles(id) NOT NULL,
          ai_follower_id INTEGER REFERENCES ai_followers(id) NOT NULL,
          added_at TIMESTAMP DEFAULT NOW(),
          muted BOOLEAN DEFAULT FALSE NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS ai_follower_collectives (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS ai_follower_collective_members (
          id SERIAL PRIMARY KEY,
          collective_id INTEGER REFERENCES ai_follower_collectives(id) NOT NULL,
          ai_follower_id INTEGER REFERENCES ai_followers(id) NOT NULL,
          added_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS circle_collectives (
          id SERIAL PRIMARY KEY,
          circle_id INTEGER REFERENCES circles(id) NOT NULL,
          collective_id INTEGER REFERENCES ai_follower_collectives(id) NOT NULL,
          added_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS pending_responses (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES posts(id) NOT NULL,
          ai_follower_id INTEGER REFERENCES ai_followers(id) NOT NULL,
          scheduled_for TIMESTAMP NOT NULL,
          processed BOOLEAN NOT NULL DEFAULT FALSE,
          metadata TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS ai_interactions (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES posts(id) NOT NULL,
          ai_follower_id INTEGER REFERENCES ai_followers(id) NOT NULL,
          content TEXT NOT NULL,
          parent_id INTEGER REFERENCES ai_interactions(id),
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT,
          data JSON,
          read BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS labs (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          goals TEXT,
          status TEXT DEFAULT 'draft' NOT NULL,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          started_at TIMESTAMP,
          completed_at TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS lab_circles (
          id SERIAL PRIMARY KEY,
          lab_id INTEGER REFERENCES labs(id) NOT NULL,
          circle_id INTEGER REFERENCES circles(id) NOT NULL,
          role TEXT NOT NULL,
          added_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS lab_content (
          id SERIAL PRIMARY KEY,
          lab_id INTEGER REFERENCES labs(id) NOT NULL,
          circle_id INTEGER REFERENCES circles(id) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS lab_analysis_results (
          id SERIAL PRIMARY KEY,
          lab_id INTEGER REFERENCES labs(id) NOT NULL,
          metric_name TEXT NOT NULL,
          actual TEXT,
          target TEXT,
          status TEXT,
          confidence INTEGER,
          difference TEXT,
          analysis TEXT,
          recommendation TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS direct_chats (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          ai_follower_id INTEGER REFERENCES ai_followers(id) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS direct_chat_messages (
          id SERIAL PRIMARY KEY,
          chat_id INTEGER REFERENCES direct_chats(id) NOT NULL,
          sender_type TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Database tables created successfully using fallback method!');
      process.exit(0);
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
      process.exit(1);
    }
  }
}

setupDatabase(); 