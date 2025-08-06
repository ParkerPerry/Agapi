import dotenv from 'dotenv';
dotenv.config();

import { db } from './db';
import * as schema from '@shared/schema';

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');
    
    // Create all tables
    await db.execute(schema.users);
    await db.execute(schema.circles);
    await db.execute(schema.posts);
    await db.execute(schema.labs);
    await db.execute(schema.labContent);
    await db.execute(schema.labCircles);
    await db.execute(schema.followers);
    await db.execute(schema.collectives);
    await db.execute(schema.circleCollectives);
    await db.execute(schema.circleFollowers);
    await db.execute(schema.circleInvitations);
    await db.execute(schema.pendingResponses);
    await db.execute(schema.interactions);
    await db.execute(schema.notifications);
    await db.execute(schema.labAnalysisResults);
    
    console.log('Database tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 