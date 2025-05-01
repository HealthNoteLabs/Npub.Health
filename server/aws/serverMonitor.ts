import { db } from '../db';
import { blossomServers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { checkInstanceStatus } from './ec2Manager';

/**
 * Monitors all Blossom servers with DEPLOYING status
 * and updates their status if needed
 */
export async function monitorDeployingServers() {
  try {
    // Find all servers in DEPLOYING status
    const deployingServers = await db.query.blossomServers.findMany({
      where: eq(blossomServers.status, 'DEPLOYING')
    });
    
    console.log(`Checking status of ${deployingServers.length} deploying servers...`);
    
    for (const server of deployingServers) {
      if (!server.instanceId) continue;
      
      try {
        const instanceStatus = await checkInstanceStatus(server.instanceId, server.region);
        
        // Update server status based on instance status
        if (instanceStatus.status !== 'DEPLOYING') {
          await db.update(blossomServers)
            .set({ 
              status: instanceStatus.status,
              publicIp: instanceStatus.publicIp,
              publicDnsName: instanceStatus.publicDnsName,
              lastChecked: new Date(),
              deployedAt: instanceStatus.status === 'RUNNING' ? new Date() : undefined,
              url: instanceStatus.status === 'RUNNING' 
                ? `http://${instanceStatus.publicIp}:3000` 
                : undefined
            })
            .where(eq(blossomServers.id, server.id));
          
          console.log(`Updated server ${server.id} status to ${instanceStatus.status}`);
        }
      } catch (error) {
        console.error(`Error checking status for server ${server.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in monitorDeployingServers:', error);
  }
}

/**
 * Monitors all running Blossom servers to check their health
 */
export async function monitorRunningServers() {
  try {
    // Find all servers in RUNNING status
    const runningServers = await db.query.blossomServers.findMany({
      where: eq(blossomServers.status, 'RUNNING')
    });
    
    console.log(`Checking health of ${runningServers.length} running servers...`);
    
    for (const server of runningServers) {
      if (!server.instanceId) continue;
      
      try {
        const instanceStatus = await checkInstanceStatus(server.instanceId, server.region);
        
        // Update server status if it's no longer running
        if (instanceStatus.status !== 'RUNNING') {
          await db.update(blossomServers)
            .set({ 
              status: instanceStatus.status,
              lastChecked: new Date(),
            })
            .where(eq(blossomServers.id, server.id));
          
          console.log(`Server ${server.id} is no longer running. Status updated to ${instanceStatus.status}`);
        } else {
          // Update last checked timestamp
          await db.update(blossomServers)
            .set({ lastChecked: new Date() })
            .where(eq(blossomServers.id, server.id));
        }
      } catch (error) {
        console.error(`Error checking health for server ${server.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in monitorRunningServers:', error);
  }
}

/**
 * Starts the server monitoring services
 */
export function startMonitoring() {
  console.log('Starting Blossom server monitoring...');
  
  // Check deploying servers every 30 seconds
  const deployingInterval = setInterval(monitorDeployingServers, 30000);
  
  // Check running servers every 5 minutes
  const runningInterval = setInterval(monitorRunningServers, 300000);
  
  return {
    stopMonitoring: () => {
      clearInterval(deployingInterval);
      clearInterval(runningInterval);
      console.log('Blossom server monitoring stopped');
    }
  };
} 