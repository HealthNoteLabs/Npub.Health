import { Request, Response } from 'express';
import { Express } from 'express';
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { launchBlossomServer } from './aws/ec2Manager';
import { db } from './db';
import { blossomServers, blossomBackups } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { startMonitoring } from './aws/serverMonitor';
import { paymentManager } from './payment/paymentManager';
import { bitvoraService } from './payment/bitvoraService';
import { getEC2InstanceLogs } from './aws/ec2Manager';

// Define types for server requests
interface BlossomServerRequest {
  serverName: string;
  region: string;
  tier: string;
  userPubkey: string;
}

interface PaymentRequest {
  serverId: string;
  userPubkey: string;
}

// Initialize monitoring if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const monitoring = startMonitoring();
  // Stop monitoring on process exit
  process.on('SIGINT', () => {
    monitoring.stopMonitoring();
    process.exit(0);
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api
  
  // Example API route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV });
  });

  // Blossom Server Management Endpoints
  
  // Get payment address for server creation
  app.post('/api/blossom/payment', async (req: Request, res: Response) => {
    try {
      const { serverName, region, tier, userPubkey } = req.body as BlossomServerRequest;
      
      // Validate inputs
      if (!serverName || !region || !tier || !userPubkey) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Generate a unique server ID
      const serverId = `server-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Calculate payment amount based on tier
      const paymentAmount = tier === 'basic' ? 0.0005 : tier === 'premium' ? 0.001 : 0.003;
      
      // Store the server request in the database
      await db.insert(blossomServers).values({
        id: serverId,
        serverName,
        region,
        tier,
        userPubkey,
        status: 'AWAITING_PAYMENT',
        createdAt: new Date(),
        storageLimit: tier === 'basic' ? 5000000000 : tier === 'premium' ? 20000000000 : 50000000000 // 5GB, 20GB, or 50GB
      });
      
      // Create Bitvora payment invoice
      const paymentDetails = await paymentManager.createPaymentInvoice(serverId);
      
      // Return payment details
      return res.json({
        serverId,
        paymentAddress: paymentDetails.btcAddress,
        paymentAmount: paymentDetails.amount,
        invoiceId: paymentDetails.invoiceId,
        paymentUrl: paymentDetails.paymentUrl,
        lightningInvoice: paymentDetails.lightningInvoice,
        expiresAt: paymentDetails.expiresAt
      });
    } catch (error) {
      console.error('Payment request error:', error);
      return res.status(500).json({ error: 'Server error processing payment request' });
    }
  });
  
  // Check payment status
  app.get('/api/blossom/payment/:invoiceId', async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.params;
      
      if (!invoiceId) {
        return res.status(400).json({ error: 'Invoice ID is required' });
      }
      
      const paymentStatus = await paymentManager.checkPaymentStatus(invoiceId);
      
      return res.json(paymentStatus);
    } catch (error) {
      console.error('Payment status check error:', error);
      return res.status(500).json({ error: 'Server error checking payment status' });
    }
  });
  
  // Bitvora webhook endpoint
  app.post('/api/blossom/webhook/bitvora', async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      const signature = req.headers['bitvora-signature'] as string;
      
      if (!signature) {
        return res.status(400).json({ error: 'Missing signature header' });
      }
      
      // Process the webhook notification
      await paymentManager.handleWebhookNotification(payload, signature);
      
      // Return 200 OK to acknowledge receipt
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return res.status(500).json({ error: 'Server error processing webhook' });
    }
  });
  
  // Deploy server after payment - modified to check payment status first
  app.post('/api/blossom/deploy', async (req: Request, res: Response) => {
    try {
      const { serverId, userPubkey } = req.body as PaymentRequest;
      
      // Validate inputs
      if (!serverId || !userPubkey) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Check if server exists in database
      const serverInfo = await db.query.blossomServers.findFirst({
        where: eq(blossomServers.id, serverId)
      });
      
      if (!serverInfo) {
        return res.status(404).json({ error: 'Server not found' });
      }
      
      // Verify ownership
      if (serverInfo.userPubkey !== userPubkey) {
        return res.status(403).json({ error: 'Unauthorized access to server' });
      }
      
      // Check payment status if invoice ID exists
      if (serverInfo.invoiceId) {
        const paymentStatus = await paymentManager.checkPaymentStatus(serverInfo.invoiceId);
        
        if (!paymentStatus.isPaid) {
          return res.status(402).json({ 
            error: 'Payment required',
            status: paymentStatus.status,
            invoiceId: serverInfo.invoiceId
          });
        }
      } else if (serverInfo.status !== 'READY_TO_DEPLOY') {
        // No invoice ID but status is not ready for deployment
        return res.status(400).json({ error: 'Server is not ready for deployment' });
      }
      
      // Update server status to DEPLOYING
      await db.update(blossomServers)
        .set({ status: 'DEPLOYING' })
        .where(eq(blossomServers.id, serverId));
      
      // Deploy the server asynchronously
      // This allows the API to respond quickly while server deployment happens in the background
      (async () => {
        try {
          // Launch the EC2 instance
          const instanceDetails = await launchBlossomServer({
            serverName: serverInfo.serverName,
            region: serverInfo.region,
            tier: serverInfo.tier,
            serverId,
            userPubkey
          });
          
          // Update the database with instance details
          await db.update(blossomServers)
            .set({
              instanceId: instanceDetails.instanceId,
              publicIp: instanceDetails.publicIp,
              publicDnsName: instanceDetails.publicDnsName
            })
            .where(eq(blossomServers.id, serverId));
            
          console.log(`Server ${serverId} deployment initiated. Instance ID: ${instanceDetails.instanceId}`);
        } catch (error: any) {
          console.error(`Error deploying server ${serverId}:`, error);
          
          // Update server status to ERROR
          await db.update(blossomServers)
            .set({ 
              status: 'ERROR',
              notes: `Deployment failed: ${error.message}`
            })
            .where(eq(blossomServers.id, serverId));
        }
      })();
      
      // Return deployment status
      return res.json({
        serverId,
        status: 'DEPLOYING',
        estimatedTime: '3-5 minutes'
      });
    } catch (error) {
      console.error('Deployment request error:', error);
      return res.status(500).json({ error: 'Server error processing deployment request' });
    }
  });
  
  // Get server status
  app.get('/api/blossom/server/:serverId', async (req: Request, res: Response) => {
    try {
      const { serverId } = req.params;
      const { pubkey } = req.query;
      
      if (!serverId) {
        return res.status(400).json({ error: 'Server ID is required' });
      }
      
      // Get server details from database
      const serverInfo = await db.query.blossomServers.findFirst({
        where: eq(blossomServers.id, serverId)
      });
      
      if (!serverInfo) {
        return res.status(404).json({ error: 'Server not found' });
      }
      
      // Basic permission check - only the server owner can view full details
      if (pubkey && serverInfo.userPubkey === pubkey) {
        // Return full server details to the owner
        return res.json({
          id: serverInfo.id,
          serverName: serverInfo.serverName,
          region: serverInfo.region,
          tier: serverInfo.tier,
          status: serverInfo.status,
          url: serverInfo.url,
          createdAt: serverInfo.createdAt,
          deployedAt: serverInfo.deployedAt,
          publicIp: serverInfo.publicIp,
          publicDnsName: serverInfo.publicDnsName,
          storageUsed: serverInfo.storageUsed,
          storageLimit: serverInfo.storageLimit
        });
      } else {
        // Return limited details to non-owners
        return res.json({
          id: serverInfo.id,
          serverName: serverInfo.serverName,
          status: serverInfo.status,
          url: serverInfo.url
        });
      }
    } catch (error) {
      console.error('Server status request error:', error);
      return res.status(500).json({ error: 'Server error fetching server status' });
    }
  });
  
  // List all servers for a user
  app.get('/api/blossom/servers', async (req: Request, res: Response) => {
    try {
      const { pubkey } = req.query;
      
      if (!pubkey) {
        return res.status(400).json({ error: 'User pubkey is required' });
      }
      
      // Get all servers for the user
      const userServers = await db.query.blossomServers.findMany({
        where: eq(blossomServers.userPubkey, String(pubkey)),
        orderBy: (servers, { desc }) => [desc(servers.createdAt)]
      });
      
      // Transform for API response
      const servers = userServers.map(server => ({
        id: server.id,
        serverName: server.serverName,
        region: server.region,
        tier: server.tier,
        status: server.status,
        url: server.url,
        createdAt: server.createdAt,
        deployedAt: server.deployedAt,
        publicIp: server.publicIp,
        publicDnsName: server.publicDnsName,
        storageUsed: server.storageUsed,
        storageLimit: server.storageLimit
      }));
      
      return res.json({ servers });
    } catch (error) {
      console.error('List servers request error:', error);
      return res.status(500).json({ error: 'Server error listing servers' });
    }
  });

  // Add this endpoint after other Blossom server endpoints
  app.post('/api/blossom/backup', async (req: Request, res: Response) => {
    try {
      const { serverId, userPubkey } = req.body;
      
      if (!serverId || !userPubkey) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Verify server ownership
      const server = await db.query.blossomServers.findFirst({
        where: and(
          eq(blossomServers.id, serverId),
          eq(blossomServers.userPubkey, userPubkey)
        )
      });
      
      if (!server) {
        return res.status(404).json({ error: 'Server not found or not owned by user' });
      }
      
      // Check if server is running
      if (server.status !== 'RUNNING') {
        return res.status(400).json({ error: 'Server must be in RUNNING state to create backup' });
      }
      
      // Trigger backup process
      const backupId = `backup-${serverId}-${Date.now()}`;
      const timestamp = new Date();
      
      // TODO: Implement actual EC2 backup functionality
      // For now, create a backup record
      await db.insert(blossomBackups).values({
        id: backupId,
        serverId: serverId,
        timestamp: timestamp,
        status: 'COMPLETED',
        size: 0, // Will be updated when backup is complete
        location: `s3://npub-health-backups/${backupId}.tar.gz`
      });
      
      // Update server last backup time
      await db.update(blossomServers)
        .set({ 
          lastBackup: timestamp
        })
        .where(eq(blossomServers.id, serverId));
      
      return res.json({
        backupId,
        timestamp,
        message: 'Backup completed successfully'
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      return res.status(500).json({ error: 'Server error processing backup request' });
    }
  });

  // Add API endpoint to view server logs
  app.get('/api/blossom/logs/:serverId', async (req: Request, res: Response) => {
    try {
      const { serverId } = req.params;
      const { userPubkey } = req.query;
      
      if (!serverId || !userPubkey) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Verify server ownership
      const server = await db.query.blossomServers.findFirst({
        where: and(
          eq(blossomServers.id, serverId),
          eq(blossomServers.userPubkey, userPubkey as string)
        )
      });
      
      if (!server) {
        return res.status(404).json({ error: 'Server not found or not owned by user' });
      }
      
      if (!server.instanceId) {
        return res.status(400).json({ error: 'Server has no associated EC2 instance' });
      }
      
      // Get instance logs
      const logs = await getEC2InstanceLogs(server.instanceId, server.region);
      
      return res.json({
        serverId,
        logs
      });
    } catch (error) {
      console.error('Error fetching server logs:', error);
      return res.status(500).json({ error: 'Server error processing logs request' });
    }
  });

  return createServer(app);
}
