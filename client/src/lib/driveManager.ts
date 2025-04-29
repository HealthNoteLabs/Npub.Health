import { EncryptedDrive } from "blossom-drive-sdk";
import { BlossomClient } from "blossom-client-sdk";
import { blossomService } from './blossomService';

// Storage keys for encryption and drive information
const ENCRYPTION_KEY_PREFIX = 'npub-health-enc-key-';
const DRIVE_ID_PREFIX = 'npub-health-drive-id-';

// Drive categories
export enum DriveCategory {
  METRICS = 'metrics',
  WORKOUTS = 'workouts',
  MEDICAL = 'medical',
  NUTRITION = 'nutrition',
  SLEEP = 'sleep'
}

/**
 * DriveManager is responsible for creating and managing encrypted drives
 * for storing health data.
 */
class DriveManager {
  private encryptionKeys: Map<string, string> = new Map();
  
  constructor() {
    // Load any stored encryption keys
    this.loadEncryptionKeys();
  }
  
  /**
   * Load stored encryption keys from localStorage
   */
  private loadEncryptionKeys() {
    try {
      // Find all keys in localStorage that start with our prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(ENCRYPTION_KEY_PREFIX)) {
          const pubkey = key.replace(ENCRYPTION_KEY_PREFIX, '');
          const encryptionKey = localStorage.getItem(key);
          if (encryptionKey) {
            this.encryptionKeys.set(pubkey, encryptionKey);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load encryption keys:', error);
    }
  }
  
  /**
   * Save an encryption key to localStorage
   */
  private saveEncryptionKey(pubkey: string, encryptionKey: string) {
    try {
      localStorage.setItem(`${ENCRYPTION_KEY_PREFIX}${pubkey}`, encryptionKey);
      this.encryptionKeys.set(pubkey, encryptionKey);
    } catch (error) {
      console.error('Failed to save encryption key:', error);
    }
  }
  
  /**
   * Generate a new random encryption key
   */
  private generateEncryptionKey(): string {
    // Generate a random 32-byte (256-bit) key
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return this.arrayBufferToHex(array.buffer);
  }
  
  /**
   * Convert ArrayBuffer to hex string
   */
  private arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  /**
   * Get an existing or create a new encryption key for a pubkey
   */
  private getOrCreateEncryptionKey(pubkey: string): string {
    let key = this.encryptionKeys.get(pubkey);
    if (!key) {
      key = this.generateEncryptionKey();
      this.saveEncryptionKey(pubkey, key);
    }
    return key;
  }
  
  /**
   * Get the ID of a previously created drive
   */
  private getDriveId(pubkey: string, category: DriveCategory): string | null {
    try {
      return localStorage.getItem(`${DRIVE_ID_PREFIX}${pubkey}-${category}`) || null;
    } catch (error) {
      console.error('Failed to get drive ID:', error);
      return null;
    }
  }
  
  /**
   * Save a drive ID to localStorage
   */
  private saveDriveId(pubkey: string, category: DriveCategory, driveId: string) {
    try {
      localStorage.setItem(`${DRIVE_ID_PREFIX}${pubkey}-${category}`, driveId);
    } catch (error) {
      console.error('Failed to save drive ID:', error);
    }
  }
  
  /**
   * Store health data in the Blossom server
   * In Phase 2, this is a simpler implementation that stores data as blobs
   * directly with the BlossomClient rather than using the full Drive functionality
   */
  async storeHealthData(
    pubkey: string, 
    category: DriveCategory,
    key: string,
    data: any
  ): Promise<string> {
    if (!blossomService.isConnected()) {
      throw new Error('Not connected to a Blossom server');
    }
    
    // Generate a filename with category, key, and timestamp
    const timestamp = new Date().toISOString();
    const fileName = `npub-health-${pubkey}-${category}-${key}-${timestamp}.json`;
    
    // Encrypt the data with the user's encryption key
    const encryptionKey = this.getOrCreateEncryptionKey(pubkey);
    const encryptedData = await this.encryptData(JSON.stringify(data), encryptionKey);
    
    // Upload as a blob
    const result = await blossomService.uploadHealthData({
      data: encryptedData,
      encryptedWithKey: encryptionKey.substring(0, 8) + '...',  // Store partial key info
      category,
      key,
      timestamp: Date.now()
    }, fileName);
    
    // Return the hash/URL of the stored blob
    return result.hash || result.url;
  }
  
  /**
   * Simple encryption function using AES-GCM
   */
  private async encryptData(data: string, key: string): Promise<string> {
    try {
      // Convert the hex key to a Uint8Array
      const keyBytes = new Uint8Array(key.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      
      // Import as CryptoKey
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      // Generate a random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the data
      const dataBytes = new TextEncoder().encode(data);
      const encryptedBytes = await window.crypto.subtle.encrypt(
        { 
          name: 'AES-GCM', 
          iv 
        },
        cryptoKey,
        dataBytes
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBytes.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBytes), iv.length);
      
      // Convert to base64
      return btoa(
        String.fromCharCode.apply(
          null, 
          // @ts-ignore - this is a workaround for the Uint8Array iteration issue
          Array.from(combined)
        )
      );
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Simple decryption function using AES-GCM
   */
  private async decryptData(encryptedData: string, key: string): Promise<string> {
    try {
      // Decode Base64 to get combined IV + encrypted data
      const binaryString = atob(encryptedData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Extract IV (first 12 bytes) and encrypted data
      const iv = bytes.slice(0, 12);
      const encryptedBytes = bytes.slice(12);
      
      // Convert the hex key to a Uint8Array
      const keyBytes = new Uint8Array(key.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      
      // Import as CryptoKey
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // Decrypt the data
      const decryptedBytes = await window.crypto.subtle.decrypt(
        { 
          name: 'AES-GCM', 
          iv 
        },
        cryptoKey,
        encryptedBytes
      );
      
      return new TextDecoder().decode(decryptedBytes);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  /**
   * Get health data from blossom storage
   */
  async getHealthData(hash: string, pubkey: string): Promise<any | null> {
    try {
      if (!blossomService.isConnected()) {
        throw new Error('Not connected to a Blossom server');
      }
      
      // Download the encrypted data
      const encryptedDataObj = await blossomService.downloadHealthData(hash);
      
      if (!encryptedDataObj || !encryptedDataObj.data) {
        throw new Error('Invalid data format returned from server');
      }
      
      // Get the encryption key
      const encryptionKey = this.getOrCreateEncryptionKey(pubkey);
      
      // Decrypt the data
      const decryptedData = await this.decryptData(encryptedDataObj.data, encryptionKey);
      
      // Parse and return the JSON data
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error(`Failed to get health data:`, error);
      return null;
    }
  }
  
  /**
   * List all health data blobs for a user
   */
  async listHealthData(pubkey: string, category?: DriveCategory): Promise<any[]> {
    try {
      if (!blossomService.isConnected()) {
        throw new Error('Not connected to a Blossom server');
      }
      
      // Get all blobs for the user
      const blobs = await blossomService.listBlobs(pubkey);
      
      // Filter by category if provided
      const filteredBlobs = category 
        ? blobs.filter(blob => 
            blob.name?.includes(`npub-health-${pubkey}-${category}`) ||
            (blob.meta && typeof blob.meta === 'object' && blob.meta.category === category)
          )
        : blobs;
      
      return filteredBlobs;
    } catch (error) {
      console.error('Failed to list health data:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const driveManager = new DriveManager(); 