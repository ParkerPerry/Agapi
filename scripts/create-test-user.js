// Script to create a test user for the CircleTube application
import 'dotenv/config';
import pg from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const { Pool } = pg;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function createTestUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Check if the test user already exists
    const checkResult = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      ['test_user']
    );

    if (checkResult.rows.length > 0) {
      console.log('Test user already exists with ID:', checkResult.rows[0].id);
      return;
    }

    // Hash the password
    const hashedPassword = await hashPassword('test_password');

    // Insert the test user
    const result = await pool.query(
      'INSERT INTO users (username, password, avatar_url, bio) VALUES ($1, $2, $3, $4) RETURNING id',
      ['test_user', hashedPassword, 'https://api.dicebear.com/7.x/avataaars/svg?seed=test_user', 'Test user for automated testing']
    );

    console.log('Created test user with ID:', result.rows[0].id);
    console.log('Username: test_user');
    console.log('Password: test_password');

    // Create a default circle for the test user
    const circleResult = await pool.query(
      'INSERT INTO circles (name, description, user_id, is_default, visibility) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['My Circle', 'Default circle for test user', result.rows[0].id, true, 'private']
    );
    
    console.log('Created default circle with ID:', circleResult.rows[0].id);

    // Add the user as a member and owner of their circle
    await pool.query(
      'INSERT INTO circle_members (circle_id, user_id, role) VALUES ($1, $2, $3)',
      [circleResult.rows[0].id, result.rows[0].id, 'owner']
    );

    console.log('Successfully created test user and default circle');
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();