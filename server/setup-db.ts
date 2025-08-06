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
      
      // Create all tables with correct column names
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT UNIQUE,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS circles (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          user_id INTEGER REFERENCES users(id),
          is_private BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          user_id INTEGER REFERENCES users(id),
          circle_id INTEGER REFERENCES circles(id),
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS labs (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          user_id INTEGER REFERENCES users(id),
          status TEXT DEFAULT 'draft',
          goals TEXT,
          hypothesis TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS lab_content (
          id SERIAL PRIMARY KEY,
          lab_id INTEGER REFERENCES labs(id),
          circle_id INTEGER REFERENCES circles(id),
          content TEXT NOT NULL,
          variant_type TEXT DEFAULT 'treatment',
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS lab_circles (
          id SERIAL PRIMARY KEY,
          lab_id INTEGER REFERENCES labs(id),
          circle_id INTEGER REFERENCES circles(id),
          role TEXT DEFAULT 'treatment',
          added_at TIMESTAMP DEFAULT NOW()
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
        
        CREATE TABLE IF NOT EXISTS collectives (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          user_id INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS circle_collectives (
          id SERIAL PRIMARY KEY,
          circle_id INTEGER REFERENCES circles(id),
          collective_id INTEGER REFERENCES collectives(id),
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS circle_followers (
          id SERIAL PRIMARY KEY,
          circle_id INTEGER REFERENCES circles(id),
          ai_follower_id INTEGER REFERENCES ai_followers(id),
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS circle_invitations (
          id SERIAL PRIMARY KEY,
          circle_id INTEGER REFERENCES circles(id),
          user_id INTEGER REFERENCES users(id),
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS pending_responses (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES posts(id),
          ai_follower_id INTEGER REFERENCES ai_followers(id),
          scheduled_for TIMESTAMP NOT NULL,
          processed BOOLEAN NOT NULL DEFAULT FALSE,
          metadata TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS interactions (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES posts(id),
          user_id INTEGER REFERENCES users(id),
          type TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          type TEXT NOT NULL,
          content TEXT NOT NULL,
          read BOOLEAN DEFAULT FALSE NOT NULL,
          metadata JSON,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS ai_interactions (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES posts(id),
          ai_follower_id INTEGER REFERENCES ai_followers(id),
          user_id INTEGER REFERENCES users(id),
          type TEXT NOT NULL,
          content TEXT,
          parent_id INTEGER REFERENCES ai_interactions(id),
          created_at TIMESTAMP DEFAULT NOW(),
          tools_used JSON
        );
        
        CREATE TABLE IF NOT EXISTS direct_chats (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          ai_follower_id INTEGER REFERENCES ai_followers(id) NOT NULL,
          content TEXT NOT NULL,
          is_user_message BOOLEAN NOT NULL,
          tools_used JSON,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS ai_follower_collectives (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          user_id INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS ai_follower_collective_members (
          id SERIAL PRIMARY KEY,
          collective_id INTEGER REFERENCES ai_follower_collectives(id),
          ai_follower_id INTEGER REFERENCES ai_followers(id),
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS circle_members (
          id SERIAL PRIMARY KEY,
          circle_id INTEGER REFERENCES circles(id),
          user_id INTEGER REFERENCES users(id),
          role TEXT DEFAULT 'member',
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS lab_templates (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          template_data JSON NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS lab_analysis_results (
          id SERIAL PRIMARY KEY,
          lab_id INTEGER REFERENCES labs(id),
          analysis_data JSON NOT NULL,
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