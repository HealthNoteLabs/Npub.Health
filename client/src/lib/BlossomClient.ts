/**
 * BlossomClient.ts
 * This is a client implementation for connecting to and interacting with Blossom servers
 */

export interface BlossomClientOptions {
  serverUrl: string;
  token?: string;
}

export interface BlobMetadata {
  filename?: string;
  contentType?: string;
  [key: string]: any;
}

export interface BlobDescriptor {
  hash: string;
  size: number;
  metadata?: BlobMetadata;
  createdAt: Date;
}

export interface ServerInfo {
  name: string;
  version: string;
  uptime: number;
  storageUsed: number;
  storageLimit: number;
  region: string;
}

/**
 * Client for interacting with Blossom servers
 */
export class BlossomClient {
  private serverUrl: string;
  private token: string | null;
  private headers: Record<string, string>;

  constructor(options: BlossomClientOptions) {
    this.serverUrl = options.serverUrl;
    this.token = options.token || null;
    
    // Set default headers
    this.headers = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if token is provided
    if (this.token) {
      this.headers['Authorization'] = `Bearer ${this.token}`;
    }
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<ServerInfo> {
    const response = await fetch(`${this.serverUrl}/api/info`, {
      method: 'GET',
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get server info: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Store a blob on the server
   */
  async storeBlob(blob: Blob, metadata?: BlobMetadata): Promise<BlobDescriptor> {
    const formData = new FormData();
    formData.append('file', blob);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    const response = await fetch(`${this.serverUrl}/api/blobs`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, browser will set it with the boundary
        ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to store blob: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Retrieve a blob from the server
   */
  async getBlob(hash: string): Promise<Blob> {
    const response = await fetch(`${this.serverUrl}/api/blobs/${hash}`, {
      method: 'GET',
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get blob: ${response.statusText}`);
    }
    
    return response.blob();
  }

  /**
   * List blobs stored on the server
   */
  async listBlobs(): Promise<BlobDescriptor[]> {
    const response = await fetch(`${this.serverUrl}/api/blobs`, {
      method: 'GET',
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list blobs: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Create a backup of the server data
   */
  async createBackup(): Promise<{ backupId: string; timestamp: Date; size: number }> {
    const response = await fetch(`${this.serverUrl}/api/backup`, {
      method: 'POST',
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create backup: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<{ backupId: string; timestamp: Date; size: number }[]> {
    const response = await fetch(`${this.serverUrl}/api/backups`, {
      method: 'GET',
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list backups: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.serverUrl}/api/backups/${backupId}/restore`, {
      method: 'POST',
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to restore backup: ${response.statusText}`);
    }
    
    return response.json();
  }
} 