import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runSeed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const pool = new Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected.');

    // 1. Run migrations first
    const migrationsPath = path.resolve(__dirname, 'migrations/001_initial_schema.sql');
    if (fs.existsSync(migrationsPath)) {
      console.log('Applying 001_initial_schema.sql...');
      const schemaSql = fs.readFileSync(migrationsPath, 'utf8');
      await client.query(schemaSql);
      console.log('Schema created successfully.');
    }

    // 2. Apply seed data
    const seedPath = path.resolve(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('Applying seed.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await client.query(seedSql);
      console.log('Seed data inserted successfully.');
    }

    client.release();
    await pool.end();
    console.log('Database initialization & seeding complete!');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

runSeed();
