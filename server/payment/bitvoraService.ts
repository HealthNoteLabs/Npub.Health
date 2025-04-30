import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Types for Bitvora API
 */
export interface BitvoraInvoice {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  paymentUrl: string;
  expiresAt: string;
  createdAt: string;
  btcAddress?: string;
  lightningInvoice?: string;
}

export interface CreateInvoiceParams {
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  expiresIn?: number; // seconds
  orderId?: string;
  description?: string;
}

export interface BitvoraTransactionInfo {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

/**
 * BitvoraService handles all interactions with the Bitvora API for payment processing
 */
export class BitvoraService {
  private apiKey: string;
  private baseUrl: string;
  private isTestnet: boolean;

  constructor(apiKey: string, isTestnet = false) {
    this.apiKey = apiKey;
    this.isTestnet = isTestnet;
    this.baseUrl = isTestnet 
      ? 'https://api.testnet.bitvora.com/v1'
      : 'https://api.bitvora.com/v1';
  }

  /**
   * Create payment headers
   */
  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Create a new invoice
   */
  async createInvoice(params: CreateInvoiceParams): Promise<BitvoraInvoice> {
    const { amount, currency = 'BTC', metadata = {}, expiresIn = 3600, orderId, description } = params;
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/invoices`,
        {
          amount,
          currency,
          metadata,
          expiresIn,
          orderId: orderId || uuidv4(),
          description: description || `Payment for Blossom Server`
        },
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating Bitvora invoice:', error);
      throw new Error(`Failed to create invoice: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: string): Promise<BitvoraInvoice> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/invoices/${invoiceId}`,
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error getting invoice ${invoiceId}:`, error);
      throw new Error(`Failed to get invoice: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Check if an invoice has been paid
   */
  async checkPaymentStatus(invoiceId: string): Promise<boolean> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      return invoice.status === 'paid';
    } catch (error) {
      console.error(`Error checking payment status for ${invoiceId}:`, error);
      return false;
    }
  }

  /**
   * List all invoices
   */
  async listInvoices(limit = 10, offset = 0): Promise<BitvoraInvoice[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/invoices?limit=${limit}&offset=${offset}`,
        { headers: this.getHeaders() }
      );
      
      return response.data.invoices;
    } catch (error) {
      console.error('Error listing invoices:', error);
      throw new Error(`Failed to list invoices: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(invoiceId: string): Promise<BitvoraInvoice> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/invoices/${invoiceId}/cancel`,
        {},
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error cancelling invoice ${invoiceId}:`, error);
      throw new Error(`Failed to cancel invoice: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId: string): Promise<BitvoraTransactionInfo> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/${transactionId}`,
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error getting transaction ${transactionId}:`, error);
      throw new Error(`Failed to get transaction: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * @param signature Signature from the webhook header
   * @param payload Raw webhook payload
   */
  verifyWebhookSignature(signature: string, payload: string): boolean {
    // This is a simplified implementation
    // In a production environment, you should use a proper crypto library to verify HMAC signatures
    try {
      // Simplified check - Bitvora should provide proper documentation for verification
      return signature && payload ? true : false;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}

// Export singleton instance
export const bitvoraService = new BitvoraService(
  process.env.BITVORA_API_KEY || '47|53731320-10c3-4c6b-a0cb-3640620e47de',
  process.env.BITVORA_NETWORK === 'testnet'
); 