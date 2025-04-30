import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Initialize database connection
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/npubhealth';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Initialize database tables
export async function initializeDb() {
  console.log('Initializing database...');
  
  // You can add migrations or initial data setup here if needed
  
  console.log('Database initialized.');
}

// For testing purposes, you can export a mock database
export class MockDatabase {
  private blossomServers = new Map();
  
  async getServerById(id: string) {
    return this.blossomServers.get(id);
  }
  
  async saveServer(server: any) {
    this.blossomServers.set(server.id, server);
    return server;
  }
  
  async updateServer(id: string, data: any) {
    const server = this.blossomServers.get(id);
    if (!server) return null;
    
    const updatedServer = { ...server, ...data };
    this.blossomServers.set(id, updatedServer);
    return updatedServer;
  }
  
  async listServersByStatus(status: string) {
    return Array.from(this.blossomServers.values())
      .filter(server => server.status === status);
  }
  
  async listServersByUser(userPubkey: string) {
    return Array.from(this.blossomServers.values())
      .filter(server => server.userPubkey === userPubkey);
  }
}

// Export mock database for development if needed
export const mockDb = new MockDatabase(); 