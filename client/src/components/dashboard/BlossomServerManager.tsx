import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Server, CreditCard, Database, Settings, ChevronRight, RefreshCw } from "lucide-react";
import blossomService from '@/lib/blossomService';
import { useNostr } from '@/components/NostrProvider';
import { PaymentModal, PaymentDetails } from "../payment/PaymentModal";
import ServerLogs from './ServerLogs';
import KeyRotationButton from './KeyRotationButton';

/**
 * Format bytes to human readable format
 */
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Define subscription tier options
const SUBSCRIPTION_TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0.0005, // BTC
    storage: '5 GB',
    features: ['Private Blossom Server', 'End-to-end Encryption', 'Basic Support'],
    recommended: false
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 0.001, // BTC
    storage: '25 GB',
    features: ['Private Blossom Server', 'End-to-end Encryption', 'Priority Support', 'Daily Backups', 'Custom Domain'],
    recommended: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0.003, // BTC
    storage: '100 GB',
    features: ['Dedicated Server Resources', 'End-to-end Encryption', 'Premium Support', 'Hourly Backups', 'Custom Domain', 'Advanced Analytics'],
    recommended: false
  }
];

// Define deployment regions
const DEPLOYMENT_REGIONS = [
  { id: 'us-east', name: 'US East (N. Virginia)' },
  { id: 'us-west', name: 'US West (Oregon)' },
  { id: 'eu-central', name: 'EU Central (Frankfurt)' },
  { id: 'ap-southeast', name: 'Asia Pacific (Singapore)' }
];

// Server status enum
export enum ServerStatus {
  NONE = 'NONE',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  DEPLOYING = 'DEPLOYING',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR'
}

// Define server info interface
export interface ServerInfo {
  id: string;
  serverName: string;
  region: string;
  tier: string;
  status: ServerStatus;
  url?: string;
  instanceId?: string;
  publicIp?: string;
  publicDnsName?: string;
  storageUsed?: number;
  storageLimit?: number;
  lastBackup?: Date;
  createdAt: Date;
  deployedAt?: Date;
}

// Add a better deployment status display
const DeploymentStatus = ({ status }: { status: ServerStatus }) => {
  const getStatusColor = () => {
    switch (status) {
      case ServerStatus.DEPLOYING:
        return 'bg-yellow-500';
      case ServerStatus.RUNNING:
        return 'bg-green-500';
      case ServerStatus.ERROR:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusMessage = () => {
    switch (status) {
      case ServerStatus.AWAITING_PAYMENT:
        return 'Awaiting Payment';
      case ServerStatus.DEPLOYING:
        return 'Deploying Server';
      case ServerStatus.RUNNING:
        return 'Server Running';
      case ServerStatus.STOPPED:
        return 'Server Stopped';
      case ServerStatus.ERROR:
        return 'Deployment Error';
      default:
        return 'Unknown Status';
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor()}`}></div>
      <span>{getStatusMessage()}</span>
    </div>
  );
};

export default function BlossomServerManager() {
  const [activeTab, setActiveTab] = useState('create');
  const [selectedTier, setSelectedTier] = useState<string>('premium');
  const [selectedRegion, setSelectedRegion] = useState<string>('us-east');
  const [serverName, setServerName] = useState('');
  const [isCreatingServer, setIsCreatingServer] = useState(false);
  const [paymentAddress, setPaymentAddress] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [serverId, setServerId] = useState('');
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>(ServerStatus.NONE);
  const [serversList, setServersList] = useState<ServerInfo[]>([]);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const { toast } = useToast();
  const { publicKey } = useNostr();
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [serverUrl, setServerUrl] = useState('');

  // Load user's existing servers when component mounts
  useEffect(() => {
    if (publicKey) {
      fetchUserServers();
    }
  }, [publicKey]);

  // Function to fetch user's servers
  const fetchUserServers = async () => {
    if (!publicKey) return;
    
    try {
      const response = await fetch(`/api/blossom/servers?pubkey=${publicKey}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch servers');
      }
      
      const data = await response.json();
      
      // Convert date strings to Date objects
      const formattedServers = (data.servers || []).map((server: any) => ({
        ...server,
        createdAt: new Date(server.createdAt),
        deployedAt: server.deployedAt ? new Date(server.deployedAt) : undefined
      }));
      
      setServersList(formattedServers);
      
      // If user has a running server, set it as the current server
      const runningServer = formattedServers.find((s: ServerInfo) => s.status === ServerStatus.RUNNING);
      
      if (runningServer) {
        setServerInfo(runningServer);
        setServerId(runningServer.id);
        setServerStatus(runningServer.status);
        setServerUrl(runningServer.url);
      }
    } catch (error) {
      console.error('Error fetching user servers:', error);
      toast({
        title: "Error",
        description: "Failed to load your servers. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to check server status
  const checkServerStatus = async (serverId: string) => {
    if (!publicKey || !serverId) return;
    
    try {
      const response = await fetch(`/api/blossom/server/${serverId}?pubkey=${publicKey}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch server status');
      }
      
      const serverData = await response.json();
      
      // Format dates
      const formattedServer = {
        ...serverData,
        createdAt: new Date(serverData.createdAt),
        deployedAt: serverData.deployedAt ? new Date(serverData.deployedAt) : undefined
      };
      
      setServerInfo(formattedServer);
      setServerStatus(serverData.status as ServerStatus);
      
      if (serverData.url) {
        setServerUrl(serverData.url);
      }
      
      return formattedServer;
    } catch (error) {
      console.error('Error checking server status:', error);
      return null;
    }
  };

  // Handle server creation
  const handleCreateServer = async () => {
    if (!publicKey) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Nostr wallet to continue.",
        variant: "destructive"
      });
      return;
    }
    
    if (!serverName) {
      toast({
        title: "Server Name Required",
        description: "Please enter a name for your Blossom server.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreatingServer(true);
    
    try {
      // 1. Request payment details
      const paymentResponse = await fetch('/api/blossom/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverName,
          region: selectedRegion,
          tier: selectedTier,
          userPubkey: publicKey
        }),
      });
      
      if (!paymentResponse.ok) {
        throw new Error('Failed to generate payment details');
      }
      
      const paymentData = await paymentResponse.json();
      
      setServerId(paymentData.serverId);
      setServerStatus(ServerStatus.AWAITING_PAYMENT);
      
      // Show payment modal with Bitcoin payment details
      setPaymentDetails({
        serverId: paymentData.serverId,
        invoiceId: paymentData.invoiceId,
        paymentAmount: paymentData.paymentAmount,
        paymentAddress: paymentData.paymentAddress,
        paymentUrl: paymentData.paymentUrl,
        lightningInvoice: paymentData.lightningInvoice,
        expiresAt: paymentData.expiresAt
      });
      setIsPaymentModalOpen(true);
      
      // Set the server status to AWAITING_PAYMENT
      // Once payment is confirmed via the modal or webhook, we'll proceed to deployment
      
    } catch (error: any) {
      console.error('Server creation error:', error);
      toast({
        title: "Server Creation Failed",
        description: error.message || "There was an error creating your server. Please try again.",
        variant: "destructive"
      });
      setIsCreatingServer(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async () => {
    if (!serverId || !publicKey) return;
    
    try {
      // Close payment modal
      setIsPaymentModalOpen(false);
      setPaymentDetails(null);
      
      // Update server status
      setServerStatus(ServerStatus.DEPLOYING);
      
      // Trigger server deployment
      const deployResponse = await fetch('/api/blossom/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId,
          userPubkey: publicKey
        }),
      });
      
      if (!deployResponse.ok) {
        throw new Error('Failed to deploy server');
      }
      
      const deployData = await deployResponse.json();
      
      toast({
        title: "Server Deployment Started",
        description: `Your Blossom server is now being deployed. This will take approximately ${deployData.estimatedTime}.`,
      });
      
      // Start polling for server status
      startStatusPolling(serverId);
    } catch (error: any) {
      console.error('Deployment error:', error);
      toast({
        title: "Deployment Failed",
        description: error.message || "There was an error deploying your server.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingServer(false);
    }
  };

  // Function to start polling for server status
  const startStatusPolling = (serverId: string) => {
    // Clear any existing interval
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
    }
    
    // Start polling
    statusIntervalRef.current = setInterval(async () => {
      const serverData = await checkServerStatus(serverId);
      
      if (!serverData) {
        // Error checking status, continue polling
        return;
      }
      
      if (serverData.status === ServerStatus.RUNNING) {
        // Server is running, stop polling
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current);
          statusIntervalRef.current = null;
        }
        
        toast({
          title: "Server Deployment Complete",
          description: "Your Blossom server is now running and ready to use!",
        });
        
        // Fetch all servers to update the list
        fetchUserServers();
      } else if (serverData.status === ServerStatus.ERROR) {
        // Server deployment failed, stop polling
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current);
          statusIntervalRef.current = null;
        }
        
        toast({
          title: "Deployment Error",
          description: "There was an error deploying your server. Please contact support.",
          variant: "destructive"
        });
      }
    }, 10000); // Check every 10 seconds
  };

  // Fetch user's servers on component mount
  useEffect(() => {
    if (publicKey) {
      fetchUserServers();
    }
  }, [publicKey]);

  // Set up status polling for any deploying server
  useEffect(() => {
    if (serverInfo && serverInfo.status === ServerStatus.DEPLOYING) {
      startStatusPolling(serverInfo.id);
    }
    
    // Cleanup on unmount
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [serverInfo]);

  // Calculate usage percentage
  const calculateUsagePercentage = () => {
    if (!serverInfo || !serverInfo.storageUsed || !serverInfo.storageLimit) return 0;
    return Math.round((serverInfo.storageUsed / serverInfo.storageLimit) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Blossom Server Management</CardTitle>
          <CardDescription>
            Create and manage your private Blossom server for secure, encrypted health data storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="create">
                <Server className="h-4 w-4 mr-2" />
                Create Server
              </TabsTrigger>
              <TabsTrigger value="manage" disabled={!serverInfo}>
                <Settings className="h-4 w-4 mr-2" />
                Manage Server
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="space-y-6">
              {isLoadingServers ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading your servers...</p>
                </div>
              ) : serversList.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Your Existing Servers</h3>
                  <div className="space-y-2">
                    {serversList.map(server => (
                      <div key={server.id} className="border rounded-md p-4 hover:border-primary/50 cursor-pointer" onClick={() => {
                        setServerInfo(server);
                        setServerStatus(server.status);
                        setServerId(server.id);
                        setActiveTab('manage');
                      }}>
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{server.serverName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {SUBSCRIPTION_TIERS.find(t => t.id === server.tier)?.name} · {DEPLOYMENT_REGIONS.find(r => r.id === server.region)?.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${
                              server.status === ServerStatus.RUNNING 
                                ? 'bg-green-500' 
                                : server.status === ServerStatus.STOPPED 
                                  ? 'bg-amber-500' 
                                  : 'bg-red-500'
                            }`}></span>
                            <span className="text-sm">{
                              server.status === ServerStatus.RUNNING 
                                ? 'Running' 
                                : server.status === ServerStatus.STOPPED 
                                  ? 'Stopped' 
                                  : server.status === ServerStatus.DEPLOYING
                                    ? 'Deploying'
                                    : 'Error'
                            }</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 mt-6">
                    <h3 className="text-lg font-medium mb-4">Create New Server</h3>
                  </div>
                </div>
              ) : null}
              
              {serverStatus === ServerStatus.DEPLOYING ? (
                <div className="text-center py-8 space-y-4">
                  <RefreshCw className="h-12 w-12 mx-auto animate-spin text-primary" />
                  <h3 className="text-xl font-semibold">Setting Up Your Server</h3>
                  <p className="text-muted-foreground">
                    We're provisioning your Blossom server. This typically takes 3-5 minutes.
                  </p>
                </div>
              ) : serverStatus === ServerStatus.AWAITING_PAYMENT ? (
                <div className="border rounded-md p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Complete Your Subscription</h3>
                  
                  <div className="p-4 bg-primary/5 rounded-md">
                    <p className="font-medium">Send exactly {paymentAmount} BTC to:</p>
                    <p className="mt-2 p-2 bg-background border rounded-md font-mono text-sm break-all">
                      {paymentAddress}
                    </p>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>Your server will be provisioned after payment confirmation.</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="server-name">Server Name</Label>
                        <Input 
                          id="server-name" 
                          placeholder="my-health-server"
                          value={serverName}
                          onChange={(e) => setServerName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          This will create a server at: {serverName ? `https://${serverName.toLowerCase().replace(/[^a-z0-9]/g, '')}.npubhealth.com` : "https://your-server-name.npubhealth.com"}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="region">Server Region</Label>
                        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                          <SelectTrigger id="region">
                            <SelectValue placeholder="Select a region" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPLOYMENT_REGIONS.map(region => (
                              <SelectItem key={region.id} value={region.id}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Subscription Tier</Label>
                      <div className="grid gap-4 pt-2">
                        {SUBSCRIPTION_TIERS.map(tier => (
                          <div 
                            key={tier.id}
                            className={`border rounded-md p-4 cursor-pointer ${selectedTier === tier.id ? 'border-primary bg-primary/5' : ''}`}
                            onClick={() => setSelectedTier(tier.id)}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold">{tier.name} {tier.recommended && <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 ml-2">Recommended</span>}</h3>
                              <p className="font-semibold">{tier.price} BTC/month</p>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{tier.storage} Storage</p>
                            <ul className="text-sm space-y-1">
                              {tier.features.map((feature, index) => (
                                <li key={index} className="flex items-center">
                                  <ChevronRight className="h-3 w-3 mr-2 text-primary" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCreateServer}
                    disabled={isCreatingServer || !serverName}
                  >
                    {isCreatingServer ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Subscribe & Deploy Server
                      </>
                    )}
                  </Button>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="manage" className="space-y-6">
              {serverInfo && (
                <>
                  <div className="flex justify-between items-center p-4 bg-primary/5 rounded-md">
                    <div>
                      <h3 className="font-semibold text-lg">{serverInfo.url || `https://${serverInfo.serverName.toLowerCase().replace(/[^a-z0-9]/g, '')}.npubhealth.com`}</h3>
                      <p className="text-sm text-muted-foreground">
                        {SUBSCRIPTION_TIERS.find(t => t.id === serverInfo.tier)?.name} Plan • 
                        {DEPLOYMENT_REGIONS.find(r => r.id === serverInfo.region)?.name}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex h-2 w-2 rounded-full mr-2 ${
                        serverInfo.status === ServerStatus.RUNNING 
                          ? 'bg-green-500' 
                          : serverInfo.status === ServerStatus.STOPPED 
                            ? 'bg-amber-500' 
                            : 'bg-red-500'
                      }`}></span>
                      <span className="text-sm font-medium">{
                        serverInfo.status === ServerStatus.RUNNING 
                          ? 'Running' 
                          : serverInfo.status === ServerStatus.STOPPED 
                            ? 'Stopped' 
                            : serverInfo.status === ServerStatus.DEPLOYING
                              ? 'Deploying'
                              : 'Error'
                      }</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Storage Usage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-primary h-full"
                              style={{ width: `${calculateUsagePercentage()}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{formatBytes(serverInfo.storageUsed || 0)} used</span>
                            <span>{formatBytes(serverInfo.storageLimit || 0)} limit</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Server Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Created</dt>
                            <dd>{serverInfo.createdAt.toLocaleDateString()}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Deployed</dt>
                            <dd>{serverInfo.deployedAt?.toLocaleDateString() || 'In progress'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Last Backup</dt>
                            <dd>{serverInfo.lastBackup?.toLocaleDateString() || 'Never'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Subscription</dt>
                            <dd>Renews on {new Date(serverInfo.createdAt.getTime() + 30*24*60*60*1000).toLocaleDateString()}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button variant="outline" onClick={async () => {
                      if (!serverInfo) return;
                      
                      // Loading state
                      toast({
                        title: "Connecting to Server",
                        description: "Attempting to connect to your Blossom server...",
                      });
                      
                      // Standardize URL generation
                      const serverUrl = serverInfo.url || 
                        `https://${serverInfo.serverName.toLowerCase().replace(/[^a-z0-9]/g, '')}.npubhealth.com`;
                      
                      try {
                        // Attempt connection with verification
                        const connected = await blossomService.connect(serverUrl);
                        
                        if (connected) {
                          // Test connection with a simple request
                          const serverDetails = await blossomService.testConnection();
                          
                          if (!serverDetails) throw new Error("Failed to verify server connection");
                          
                          toast({
                            title: "Connected to Server",
                            description: `Successfully connected to your Blossom server at ${serverUrl}`,
                          });
                        } else {
                          throw new Error("Connection failed");
                        }
                      } catch (error) {
                        console.error("Server connection error:", error);
                        toast({
                          title: "Connection Failed",
                          description: `Could not connect to ${serverUrl}. Please check that your server is running.`,
                          variant: "destructive"
                        });
                      }
                    }}>
                      <Database className="h-4 w-4 mr-2" />
                      Connect to Server
                    </Button>
                    
                    <Button variant="outline" onClick={async () => {
                      if (!serverInfo) return;
                      
                      // Show loading toast
                      toast({
                        title: "Creating Backup",
                        description: "Initiating backup of your server data...",
                      });
                      
                      try {
                        // Call actual backup API
                        const response = await fetch(`/api/blossom/backup`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            serverId: serverInfo.id,
                            userPubkey: publicKey,
                          }),
                        });
                        
                        if (!response.ok) {
                          throw new Error('Backup request failed');
                        }
                        
                        const result = await response.json();
                        
                        // Update last backup time
                        setServerInfo({
                          ...serverInfo,
                          lastBackup: new Date()
                        });
                        
                        toast({
                          title: "Backup Created",
                          description: "A new backup of your server has been created successfully",
                        });
                      } catch (error) {
                        console.error("Backup error:", error);
                        toast({
                          title: "Backup Failed",
                          description: "Could not create server backup. Please try again later.",
                          variant: "destructive"
                        });
                      }
                    }}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Create Backup
                    </Button>
                    
                    <KeyRotationButton />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        paymentDetails={paymentDetails}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
} 