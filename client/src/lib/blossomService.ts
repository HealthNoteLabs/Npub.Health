import { BlossomClient } from "blossom-client-sdk";
import { Event } from 'nostr-tools';
import { EventEmitter } from './EventEmitter';

// Storage keys
const BLOSSOM_URL_KEY = 'npub-health-blossom-url';
const BLOSSOM_TOKEN_KEY = 'npub-health-blossom-token';

interface BlossomConfig {
  url: string;
  token?: string;
}

/**
 * Create a Nostr signer function for Blossom authentication
 */
async function createNostrSigner(event: any): Promise<Event> {
  if (!window.nostr) {
    throw new Error('Nostr extension not found');
  }
  return await window.nostr.signEvent(event);
}

/**
 * BlossomService handles interactions with Blossom servers
 */
class BlossomService extends EventEmitter {
  private client: BlossomClient | null = null;
  private url: string | null = null;
  private token: string | null = null;

  constructor() {
    super();
    // Load stored configuration
    this.loadConfig();
  }

  /**
   * Load stored Blossom configuration
   */
  private loadConfig() {
    try {
      const savedUrl = localStorage.getItem(BLOSSOM_URL_KEY);
      const savedToken = localStorage.getItem(BLOSSOM_TOKEN_KEY);
      
      if (savedUrl) {
        this.url = savedUrl;
        this.token = savedToken || null;
        
        // Initialize client if URL exists
        if (this.url) {
          this.client = new BlossomClient(this.url, createNostrSigner);
        }
      }
    } catch (error) {
      console.error('Failed to load Blossom configuration:', error);
    }
  }

  /**
   * Save Blossom configuration
   */
  private saveConfig(config: BlossomConfig) {
    try {
      localStorage.setItem(BLOSSOM_URL_KEY, config.url);
      
      if (config.token) {
        localStorage.setItem(BLOSSOM_TOKEN_KEY, config.token);
      } else {
        localStorage.removeItem(BLOSSOM_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Failed to save Blossom configuration:', error);
    }
  }

  /**
   * Connect to a Blossom server
   */
  async connect(url: string): Promise<boolean> {
    try {
      // Normalize URL (ensure it has trailing slash)
      const normalizedUrl = url.endsWith('/') ? url : `${url}/`;
      
      // Create a new client
      const client = new BlossomClient(normalizedUrl, createNostrSigner);
      
      // Test the connection
      const healthCheck = await fetch(new URL('health', normalizedUrl).toString(), {
        method: 'GET',
      });
      
      if (!healthCheck.ok) {
        throw new Error(`Failed to connect to Blossom server: ${healthCheck.statusText}`);
      }

      // Update service state
      this.client = client;
      this.url = normalizedUrl;
      
      // Save configuration
      this.saveConfig({ url: normalizedUrl });
      
      // Emit connected event
      this.emit('connected', normalizedUrl);
      
      return true;
    } catch (error) {
      console.error('Failed to connect to Blossom server:', error);
      return false;
    }
  }

  /**
   * Disconnect from the Blossom server
   */
  disconnect(): void {
    this.client = null;
    this.url = null;
    this.token = null;
    
    // Clear stored configuration
    localStorage.removeItem(BLOSSOM_URL_KEY);
    localStorage.removeItem(BLOSSOM_TOKEN_KEY);
    
    // Emit disconnected event
    this.emit('disconnected');
  }

  /**
   * Check if connected to a Blossom server
   */
  isConnected(): boolean {
    return !!this.client && !!this.url;
  }

  /**
   * Get the current Blossom server URL
   */
  getServerUrl(): string | null {
    return this.url;
  }

  /**
   * List blobs for the current user
   */
  async listBlobs(pubkey: string): Promise<any[]> {
    if (!this.client) {
      throw new Error('Not connected to a Blossom server');
    }

    try {
      return await this.client.listBlobs(pubkey);
    } catch (error) {
      console.error('Failed to list blobs:', error);
      throw error;
    }
  }

  /**
   * Upload health data to Blossom
   */
  async uploadHealthData(data: any, fileName: string): Promise<any> {
    if (!this.client) {
      throw new Error('Not connected to a Blossom server');
    }

    try {
      // Convert data to file
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const file = new File([blob], fileName, { type: 'application/json' });
      
      // Upload the file
      return await this.client.uploadBlob(file);
    } catch (error) {
      console.error('Failed to upload health data:', error);
      throw error;
    }
  }

  /**
   * Download health data from Blossom
   */
  async downloadHealthData(blobHash: string): Promise<any> {
    if (!this.client || !this.url) {
      throw new Error('Not connected to a Blossom server');
    }

    try {
      const response = await fetch(new URL(blobHash, this.url).toString());
      
      if (!response.ok) {
        throw new Error(`Failed to download health data: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to download health data:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const blossomService = new BlossomService(); 