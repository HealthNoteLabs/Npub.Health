#!/usr/bin/env node

/**
 * Database setup script for Npub.Health Blossom server management
 * This script creates the necessary database tables for production
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
const path = require('path');
const readline = require('readline');
const fs = require('fs');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask questions
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('=== Npub.Health Database Setup ===');
  
  let connectionString;
  
  // First check environment variable
  if (process.env.DATABASE_URL) {
    connectionString = process.env.DATABASE_URL;
    console.log(`Using database connection from DATABASE_URL environment variable`);
  } else {
    // Ask for database connection details if not provided
    console.log('Please provide your PostgreSQL database connection details:');
    const host = await question('Host [localhost]: ') || 'localhost';
    const port = await question('Port [5432]: ') || '5432';
    const database = await question('Database [npubhealth]: ') || 'npubhealth';
    const user = await question('Username [postgres]: ') || 'postgres';
    const password = await question('Password: ');

    connectionString = `postgres://${user}:${password}@${host}:${port}/${database}`;
    
    // Ask if they want to save to .env file
    const saveToEnv = (await question('Save connection string to .env file? (y/n): ')).toLowerCase() === 'y';
    
    if (saveToEnv) {
      try {
        // Check if .env file exists
        let envContent = '';
        if (fs.existsSync('.env')) {
          envContent = fs.readFileSync('.env', 'utf8');
        }
        
        // Check if DATABASE_URL is already in the file
        if (envContent.includes('DATABASE_URL=')) {
          // Replace existing entry
          envContent = envContent.replace(/DATABASE_URL=.*(\r?\n|$)/g, `DATABASE_URL=${connectionString}\n`);
        } else {
          // Add new entry
          envContent += `\nDATABASE_URL=${connectionString}\n`;
        }
        
        // Write back to .env file
        fs.writeFileSync('.env', envContent);
        console.log('✓ Connection string saved to .env file');
      } catch (error) {
        console.error('Error saving to .env file:', error.message);
      }
    }
  }

  // Connect to the database
  console.log('Connecting to database...');
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    // Create tables
    console.log('Creating tables...');
    
    // Define schema for Blossom servers table
    const createBlossomServersTable = `
    CREATE TABLE IF NOT EXISTS blossom_servers (
      id TEXT PRIMARY KEY,
      server_name TEXT NOT NULL,
      region TEXT NOT NULL,
      tier TEXT NOT NULL,
      user_pubkey TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'AWAITING_PAYMENT',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      deployed_at TIMESTAMP,
      payment_address TEXT,
      payment_amount TEXT,
      instance_id TEXT,
      public_ip TEXT,
      public_dns_name TEXT,
      url TEXT,
      storage_used INTEGER DEFAULT 0,
      storage_limit BIGINT NOT NULL DEFAULT 5000000000,
      is_active BOOLEAN DEFAULT TRUE,
      last_checked TIMESTAMP,
      notes TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_blossom_servers_user_pubkey ON blossom_servers(user_pubkey);
    CREATE INDEX IF NOT EXISTS idx_blossom_servers_status ON blossom_servers(status);
    `;
    
    // Execute the SQL
    await client.unsafe(createBlossomServersTable);
    console.log('✓ Database tables created successfully');
    
    // Check connection
    const result = await client`SELECT NOW();`;
    console.log(`✓ Database connection successful: ${result[0].now}`);
    
    console.log('\n=== Next Steps ===');
    console.log('1. Make sure your .env file includes the DATABASE_URL');
    console.log('2. Configure AWS credentials and security groups');
    console.log('3. Run the application with production settings: NODE_ENV=production npm start');
    
  } catch (error) {
    console.error('✖ Database setup error:', error.message);
    console.error(error);
  } finally {
    // Close the database connection
    await client.end();
    rl.close();
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 