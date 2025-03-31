import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Additional configuration (these are custom properties)
// Note: We're extending the neonConfig object with additional properties
// even though they're not in the type definition
(neonConfig as any).retryCount = 5;
(neonConfig as any).retryDelay = 1000;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with additional settings for better resilience
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
});

// Log connection issues for debugging
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export const db = drizzle({ client: pool, schema });

// Simple function to test database connection
export async function testDbConnection() {
  try {
    const client = await pool.connect();
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
