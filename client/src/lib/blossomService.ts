import { EventEmitter } from 'events';
import { BlossomClient, ServerInfo, BlobDescriptor } from './BlossomClient';

// Health data interface
export interface HealthData {
  data: any;
  encryptedWithKey?: string;
  category?: string;
  key?: string;
  timestamp: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

/**
 * BlossomService handles interactions with Blossom servers
 */
class BlossomService extends EventEmitter {
  private client: BlossomClient | null = null;
  private url: string = '';
  private token: string | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';

  constructor() {
    super();
    this.loadSavedConnection();
  }

  /**
   * Check if currently connected to a Blossom server
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.client !== null;
  }

  /**
   * Load any saved connection from localStorage
   */
  private loadSavedConnection() {
    try {
      const savedUrl = localStorage.getItem('blossom_url');
      const savedToken = localStorage.getItem('blossom_token');
      
      if (savedUrl) {
        this.connect(savedUrl, savedToken || undefined);
      }
    } catch (error) {
      console.error('Error loading saved Blossom connection:', error);
    }
  }

  /**
   * Test connection to the Blossom server
   * @returns Server information if connection is successful, null otherwise
   */
  async testConnection(): Promise<ServerInfo | null> {
    try {
      if (!this.client) {
        return null;
      }
      
      // Call getServerInfo method on the client
      const serverInfo = await this.client.getServerInfo();
      return serverInfo;
    } catch (error) {
      console.error('Error testing connection to Blossom server:', error);
      return null;
    }
  }

  /**
   * Connect to a Blossom server
   */
  async connect(url: string, token?: string): Promise<boolean> {
    try {
      this.connectionStatus = 'connecting';
      this.emit('connecting', { url });
      
      // Initialize client
      this.client = new BlossomClient({
        serverUrl: url,
        token: token
      });
      
      // Test connection
      await this.client.getServerInfo();
      
      // Save connection details
      this.url = url;
      this.token = token || null;
      this.connectionStatus = 'connected';
      
      // Store in localStorage for persistence
      localStorage.setItem('blossom_url', url);
      if (token) localStorage.setItem('blossom_token', token);
      
      this.emit('connected', { url });
      return true;
    } catch (error) {
      this.connectionStatus = 'disconnected';
      this.client = null;
      this.emit('error', { error });
      console.error('Failed to connect to Blossom server:', error);
      return false;
    }
  }

  /**
   * Disconnect from the current Blossom server
   */
  disconnect(): void {
    this.client = null;
    this.url = '';
    this.token = null;
    this.connectionStatus = 'disconnected';
    
    // Remove from localStorage
    localStorage.removeItem('blossom_url');
    localStorage.removeItem('blossom_token');
    
    this.emit('disconnected');
  }

  /**
   * Upload health data to the Blossom server
   */
  async uploadHealthData(data: HealthData, filename: string): Promise<{ hash: string; url: string }> {
    if (!this.client) {
      throw new Error('Not connected to a Blossom server');
    }
    
    try {
      // Convert data to JSON and then to blob
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      
      // Upload to Blossom server
      const result = await this.client.storeBlob(blob, { filename });
      
      return {
        hash: result.hash,
        url: `${this.url}/api/blobs/${result.hash}`
      };
    } catch (error) {
      console.error('Error uploading health data to Blossom server:', error);
      throw error;
    }
  }

  /**
   * Download health data from the Blossom server
   */
  async downloadHealthData(hash: string): Promise<HealthData> {
    if (!this.client) {
      throw new Error('Not connected to a Blossom server');
    }
    
    try {
      const blob = await this.client.getBlob(hash);
      const text = await blob.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Error downloading health data from Blossom server:', error);
      throw error;
    }
  }

  /**
   * List all health data stored on the Blossom server
   */
  async listHealthData(): Promise<BlobDescriptor[]> {
    if (!this.client) {
      throw new Error('Not connected to a Blossom server');
    }
    
    try {
      return await this.client.listBlobs();
    } catch (error) {
      console.error('Error listing health data on Blossom server:', error);
      throw error;
    }
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<ServerInfo> {
    if (!this.client) {
      throw new Error('Not connected to a Blossom server');
    }
    
    try {
      return await this.client.getServerInfo();
    } catch (error) {
      console.error('Error getting server info from Blossom server:', error);
      throw error;
    }
  }

  /**
   * Create a backup of the server
   */
  async createBackup(): Promise<{ backupId: string; timestamp: Date; size: number }> {
    if (!this.client) {
      throw new Error('Not connected to a Blossom server');
    }
    
    try {
      return await this.client.createBackup();
    } catch (error) {
      console.error('Error creating backup on Blossom server:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<{ backupId: string; timestamp: Date; size: number }[]> {
    if (!this.client) {
      throw new Error('Not connected to a Blossom server');
    }
    
    try {
      return await this.client.listBackups();
    } catch (error) {
      console.error('Error listing backups on Blossom server:', error);
      throw error;
    }
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      throw new Error('Not connected to a Blossom server');
    }
    
    try {
      return await this.client.restoreBackup(backupId);
    } catch (error) {
      console.error('Error restoring backup on Blossom server:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const blossomService = new BlossomService();

export default blossomService; 