import { db } from '../db';
import { blossomServers, paymentInvoices, paymentTransactions } from '../db/schema';
import { bitvoraService, BitvoraInvoice, CreateInvoiceParams } from './bitvoraService';
import { eq } from 'drizzle-orm';

// Tier costs in BTC
const TIER_COSTS = {
  'basic': 0.0005,  
  'premium': 0.001,
  'enterprise': 0.003
};

/**
 * PaymentManager handles payment processing for Blossom server subscriptions
 */
export class PaymentManager {
  /**
   * Create a new payment invoice for a server
   */
  async createPaymentInvoice(serverId: string): Promise<{
    invoiceId: string;
    paymentUrl: string;
    btcAddress?: string;
    lightningInvoice?: string;
    amount: number;
    expiresAt: Date;
  }> {
    try {
      // Get server details
      const server = await db.query.blossomServers.findFirst({
        where: eq(blossomServers.id, serverId)
      });
      
      if (!server) {
        throw new Error(`Server not found: ${serverId}`);
      }
      
      if (server.status !== 'AWAITING_PAYMENT') {
        throw new Error(`Server is not awaiting payment: ${serverId}`);
      }
      
      // Determine payment amount based on tier
      const amount = TIER_COSTS[server.tier] || 0.001;
      
      // Create invoice with Bitvora
      const invoiceParams: CreateInvoiceParams = {
        amount,
        currency: 'BTC',
        metadata: {
          serverId,
          serverName: server.serverName,
          userPubkey: server.userPubkey
        },
        description: `Blossom Server: ${server.serverName} (${server.tier})`,
        orderId: serverId,
        expiresIn: 3600 // 1 hour expiry
      };
      
      const invoice = await bitvoraService.createInvoice(invoiceParams);
      
      // Save invoice to database
      await db.insert(paymentInvoices).values({
        id: invoice.id,
        serverId,
        amount: amount.toString(),
        currency: 'BTC',
        status: invoice.status,
        paymentUrl: invoice.paymentUrl,
        btcAddress: invoice.btcAddress,
        lightningInvoice: invoice.lightningInvoice,
        expiresAt: new Date(invoice.expiresAt),
        createdAt: new Date(invoice.createdAt),
        metadata: JSON.stringify(invoiceParams.metadata)
      });
      
      // Update server with invoice ID reference
      await db.update(blossomServers)
        .set({
          invoiceId: invoice.id,
          paymentAmount: amount.toString()
        })
        .where(eq(blossomServers.id, serverId));
      
      return {
        invoiceId: invoice.id,
        paymentUrl: invoice.paymentUrl,
        btcAddress: invoice.btcAddress,
        lightningInvoice: invoice.lightningInvoice,
        amount,
        expiresAt: new Date(invoice.expiresAt)
      };
    } catch (error: any) {
      console.error('Error creating payment invoice:', error);
      throw new Error(`Failed to create payment invoice: ${error.message}`);
    }
  }
  
  /**
   * Check payment status
   */
  async checkPaymentStatus(invoiceId: string): Promise<{
    status: string;
    isPaid: boolean;
  }> {
    try {
      // Check existing payment status in DB
      const invoiceRecord = await db.query.paymentInvoices.findFirst({
        where: eq(paymentInvoices.id, invoiceId)
      });
      
      if (!invoiceRecord) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }
      
      // If already marked as paid, return immediately
      if (invoiceRecord.status === 'paid') {
        return { status: 'paid', isPaid: true };
      }
      
      // Check with Bitvora
      const invoice = await bitvoraService.getInvoice(invoiceId);
      
      // Update local record if status has changed
      if (invoice.status !== invoiceRecord.status) {
        await db.update(paymentInvoices)
          .set({
            status: invoice.status,
            paidAt: invoice.status === 'paid' ? new Date() : null
          })
          .where(eq(paymentInvoices.id, invoiceId));
        
        // If paid, update server status
        if (invoice.status === 'paid') {
          await this.handleSuccessfulPayment(invoiceId);
        }
      }
      
      return {
        status: invoice.status,
        isPaid: invoice.status === 'paid'
      };
    } catch (error: any) {
      console.error(`Error checking payment status for ${invoiceId}:`, error);
      throw new Error(`Failed to check payment status: ${error.message}`);
    }
  }
  
  /**
   * Handle webhook notification
   */
  async handleWebhookNotification(payload: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      const isValid = bitvoraService.verifyWebhookSignature(signature, JSON.stringify(payload));
      
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
      
      // Process based on event type
      if (payload.event === 'invoice.paid') {
        const invoiceId = payload.data.id;
        await this.handleSuccessfulPayment(invoiceId);
      }
      
      // Handle other event types as needed
    } catch (error: any) {
      console.error('Error handling webhook notification:', error);
      throw new Error(`Failed to process webhook: ${error.message}`);
    }
  }
  
  /**
   * Handle successful payment
   */
  private async handleSuccessfulPayment(invoiceId: string): Promise<void> {
    try {
      // Update invoice status
      await db.update(paymentInvoices)
        .set({
          status: 'paid',
          paidAt: new Date()
        })
        .where(eq(paymentInvoices.id, invoiceId));
      
      // Find related server
      const invoice = await db.query.paymentInvoices.findFirst({
        where: eq(paymentInvoices.id, invoiceId)
      });
      
      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }
      
      // Update server status to allow deployment
      await db.update(blossomServers)
        .set({ status: 'READY_TO_DEPLOY' })
        .where(eq(blossomServers.id, invoice.serverId));
      
      console.log(`Payment processed successfully for server ${invoice.serverId}`);
    } catch (error: any) {
      console.error(`Error handling successful payment for ${invoiceId}:`, error);
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }
  
  /**
   * Cancel payment
   */
  async cancelPayment(invoiceId: string): Promise<void> {
    try {
      // Cancel with Bitvora
      await bitvoraService.cancelInvoice(invoiceId);
      
      // Update local record
      await db.update(paymentInvoices)
        .set({ status: 'cancelled' })
        .where(eq(paymentInvoices.id, invoiceId));
      
      // Get the server ID
      const invoice = await db.query.paymentInvoices.findFirst({
        where: eq(paymentInvoices.id, invoiceId)
      });
      
      if (invoice) {
        // Reset server status
        await db.update(blossomServers)
          .set({
            status: 'AWAITING_PAYMENT',
            invoiceId: null
          })
          .where(eq(blossomServers.id, invoice.serverId));
      }
    } catch (error: any) {
      console.error(`Error cancelling payment for ${invoiceId}:`, error);
      throw new Error(`Failed to cancel payment: ${error.message}`);
    }
  }
}

// Export singleton instance
export const paymentManager = new PaymentManager(); 