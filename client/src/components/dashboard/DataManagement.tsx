import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Cloud,
  Database,
  Download,
  Upload,
  Shield,
  Server,
  RefreshCw,
  Home,
  AlertTriangle
} from "lucide-react";
import { blossomService } from '@/lib/blossomService';
import { useNostr } from '../../components/NostrProvider';
import { driveManager, DriveCategory } from '@/lib/driveManager';

interface DataManagementProps {
  connected?: boolean;
  relays?: string[];
  blossomConnected?: boolean;
  blossomUrl?: string;
}

interface MetricPrivacySettings {
  isPublic: boolean;
  encrypted: boolean;
  storage: 'relay' | 'blossom' | 'drive';
}

export default function DataManagement({
  connected = false,
  relays = [],
  blossomConnected: initialBlossomConnected = false,
  blossomUrl: initialBlossomUrl = ''
}: DataManagementProps) {
  const [activeTab, setActiveTab] = useState('import');
  const [importSource, setImportSource] = useState('relay');
  const [exportDestination, setExportDestination] = useState('relay');
  const [customRelayUrl, setCustomRelayUrl] = useState('');
  const [customBlossomUrl, setCustomBlossomUrl] = useState(initialBlossomUrl || '');
  const [loading, setLoading] = useState(false);
  const [blossomConnected, setBlossomConnected] = useState(initialBlossomConnected || blossomService.isConnected());
  const [blossomUrl, setBlossomUrl] = useState(initialBlossomUrl || blossomService.getServerUrl() || '');
  const { toast } = useToast();
  const { publicKey } = useNostr();
  const [metricPrivacySettings, setMetricPrivacySettings] = useState<Record<string, MetricPrivacySettings>>({
    weight: { isPublic: false, encrypted: true, storage: 'drive' },
    height: { isPublic: false, encrypted: true, storage: 'drive' },
    age: { isPublic: false, encrypted: true, storage: 'drive' },
    gender: { isPublic: false, encrypted: true, storage: 'drive' },
    fitnessLevel: { isPublic: true, encrypted: false, storage: 'relay' },
    workouts: { isPublic: true, encrypted: false, storage: 'relay' },
    running: { isPublic: true, encrypted: false, storage: 'relay' },
    meditation: { isPublic: true, encrypted: false, storage: 'relay' },
    habits: { isPublic: true, encrypted: false, storage: 'relay' },
    sleep: { isPublic: false, encrypted: true, storage: 'drive' },
    nutrition: { isPublic: false, encrypted: true, storage: 'drive' },
    spiritual: { isPublic: true, encrypted: false, storage: 'relay' },
    lifting: { isPublic: true, encrypted: false, storage: 'relay' }
  });

  // Load blossom connection status on component mount
  useEffect(() => {
    const isConnected = blossomService.isConnected();
    setBlossomConnected(isConnected);
    
    if (isConnected) {
      const url = blossomService.getServerUrl();
      if (url) {
        setBlossomUrl(url);
        setCustomBlossomUrl(url);
      }
    }
  }, []);

  // Add event listener for blossom disconnection
  useEffect(() => {
    // Listen for the disconnected event to clear any stored data
    const handleDisconnect = () => {
      console.log('Blossom server disconnected, clearing cached data');
      // No need to call clearDrives as that's been removed from our implementation
    };
    
    blossomService.on('disconnected', handleDisconnect);
    
    return () => {
      blossomService.removeListener('disconnected', handleDisconnect);
    };
  }, []);

  // These functions would connect to actual API endpoints in a real implementation
  const handleImport = async () => {
    setLoading(true);
    
    try {
      if (importSource === 'blossom') {
        if (!blossomConnected) {
          throw new Error('Not connected to a Blossom server');
        }
        
        if (!publicKey) {
          throw new Error('Nostr public key not available');
        }
        
        // Fetch data from Blossom
        const blobs = await driveManager.listHealthData(publicKey, DriveCategory.METRICS);
        
        if (blobs.length === 0) {
          toast({
            title: "No Data Found",
            description: "No health metrics found in Blossom server",
          });
        } else {
          // For this phase, just show we found the data
          toast({
            title: "Import Successful",
            description: `Found ${blobs.length} health metrics in Blossom server`,
          });
          
          // For the first few blobs, try to fetch and display their content
          if (blobs.length > 0) {
            const sample = blobs.slice(0, Math.min(3, blobs.length));
            
            // Process each blob to extract its data
            for (const blob of sample) {
              try {
                if (blob.hash) {
                  const data = await driveManager.getHealthData(blob.hash, publicKey);
                  console.log(`Retrieved blob data:`, data);
                }
              } catch (e) {
                console.error(`Error getting blob data:`, e);
              }
            }
          }
        }
      } else {
        // Simulate relay import for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
          title: "Import Successful",
          description: "Data imported from relays successfully",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    
    try {
      if (exportDestination === 'blossom') {
        if (!blossomConnected) {
          throw new Error('Not connected to a Blossom server');
        }
        
        if (!publicKey) {
          throw new Error('Nostr public key not available');
        }
        
        // Mock data for this phase
        const metrics = {
          weight: { value: '75', unit: 'kg' },
          height: { value: '180', unit: 'cm' },
        };
        
        // Store each selected metric in the drive
        const exportResults = [];
        
        // Get the checked metrics from the UI
        const checkedMetrics = Object.entries(metricPrivacySettings)
          .filter(([metricName, _]) => {
            const checkbox = document.getElementById(`export-${metricName}`) as HTMLInputElement;
            return checkbox && checkbox.checked;
          })
          .map(([metricName, _]) => metricName);
        
        // Store each checked metric
        for (const metricName of checkedMetrics) {
          if (metrics[metricName as keyof typeof metrics]) {
            const result = await driveManager.storeHealthData(
              publicKey,
              DriveCategory.METRICS,
              metricName,
              metrics[metricName as keyof typeof metrics]
            );
            exportResults.push({ metric: metricName, result });
          }
        }
        
        toast({
          title: "Export Successful",
          description: `Exported ${exportResults.length} metrics to Blossom server`,
        });
      } else {
        // Simulate relay export for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
          title: "Export Successful",
          description: "Data exported to relays successfully",
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBlossom = async () => {
    if (!customBlossomUrl) {
      toast({
        title: "Connection Failed",
        description: "Please enter a valid Blossom server URL",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await blossomService.connect(customBlossomUrl);
      
      if (success) {
        setBlossomConnected(true);
        setBlossomUrl(customBlossomUrl);
        
        toast({
          title: "Connection Successful",
          description: `Connected to Blossom server at ${customBlossomUrl}`,
        });
      } else {
        throw new Error('Failed to connect to Blossom server');
      }
    } catch (error) {
      console.error('Blossom connection error:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Blossom server",
        variant: "destructive"
      });
      setBlossomConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectBlossom = () => {
    blossomService.disconnect();
    setBlossomConnected(false);
    setBlossomUrl('');
    
    toast({
      title: "Disconnected",
      description: "Disconnected from Blossom server",
    });
  };

  const updateMetricStorage = (metric: string, storage: 'relay' | 'blossom' | 'drive') => {
    setMetricPrivacySettings(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        storage,
        encrypted: storage === 'drive' ? true : prev[metric].encrypted
      }
    }));
  };

  const toggleMetricPrivacy = (metric: string, setting: 'isPublic' | 'encrypted') => {
    setMetricPrivacySettings(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [setting]: !prev[metric][setting]
      }
    }));
  };

  const handleConnectRelay = () => {
    if (!customRelayUrl) {
      toast({
        title: "Connection Failed",
        description: "Please enter a valid relay URL",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    // Simulate relay connection for now
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Connection Successful",
        description: `Connected to relay at ${customRelayUrl}`,
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Control where your health data is stored and how it's shared
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full mb-6">
              <TabsTrigger value="import">
                <Download className="h-4 w-4 mr-2" />
                Import Data
              </TabsTrigger>
              <TabsTrigger value="export">
                <Upload className="h-4 w-4 mr-2" />
                Export Data
              </TabsTrigger>
              <TabsTrigger value="privacy">
                <Shield className="h-4 w-4 mr-2" />
                Privacy Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="import" className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 border rounded-md cursor-pointer ${importSource === 'relay' ? 'border-primary bg-primary/5' : 'border-border'}`} 
                    onClick={() => setImportSource('relay')}>
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Nostr Relays</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Import data from public Nostr relays</p>
                  </div>
                  
                  <div className={`p-4 border rounded-md cursor-pointer ${importSource === 'blossom' ? 'border-primary bg-primary/5' : 'border-border'}`}
                    onClick={() => setImportSource('blossom')}>
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Blossom Server</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Import from your private Blossom server</p>
                  </div>
                </div>
                
                {importSource === 'relay' && (
                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Connected Relays</h3>
                      {relays.length > 0 ? (
                        <ul className="space-y-2">
                          {relays.map((relay, index) => (
                            <li key={index} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded">
                              <span>{relay}</span>
                              <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">Connected</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No relays connected</p>
                      )}
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Add Custom Relay</h3>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="wss://relay.example.com" 
                          value={customRelayUrl}
                          onChange={(e) => setCustomRelayUrl(e.target.value)}
                        />
                        <Button onClick={handleConnectRelay} disabled={!customRelayUrl || loading}>
                          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Connect"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {importSource === 'blossom' && (
                  <div className="space-y-4">
                    <div className="border rounded-md p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Blossom Server Status</h3>
                        {blossomConnected ? (
                          <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">Connected</span>
                        ) : (
                          <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full">Not Connected</span>
                        )}
                      </div>
                      
                      {blossomConnected && (
                        <div className="p-2 bg-muted/20 rounded flex justify-between items-center">
                          <span className="text-sm">{blossomUrl}</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleDisconnectBlossom}
                          >
                            Disconnect
                          </Button>
                        </div>
                      )}
                      
                      {!blossomConnected && (
                        <div className="space-y-2">
                          <Label htmlFor="blossom-url">Blossom Server URL</Label>
                          <div className="flex gap-2">
                            <Input 
                              id="blossom-url"
                              placeholder="https://blossom.example.com" 
                              value={customBlossomUrl}
                              onChange={(e) => setCustomBlossomUrl(e.target.value)}
                            />
                            <Button onClick={handleConnectBlossom} disabled={!customBlossomUrl || loading}>
                              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Connect"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Blossom Server Promotion */}
                    <div className="border border-primary/20 rounded-md p-4 space-y-3 bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex items-start gap-3">
                        <Server className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-medium text-lg mb-1">Create Your Own Blossom Server</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Take full control of your health data by setting up your own private Blossom server.
                            Enjoy enhanced privacy, customizable storage, and complete data sovereignty.
                          </p>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="flex items-center gap-1.5 text-sm">
                              <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                              </div>
                              <span>End-to-end encryption</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                              <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                              </div>
                              <span>Complete privacy</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                              <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                              </div>
                              <span>Automatic backups</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                              <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                              </div>
                              <span>Premium support</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Button 
                          variant="gradient" 
                          className="w-full" 
                          size="sm"
                          onClick={() => {
                            const tabElement = document.querySelector('[value="blossom-server"]') as HTMLElement;
                            if (tabElement) {
                              tabElement.click();
                            }
                          }}
                        >
                          <Server className="h-3.5 w-3.5 mr-2" />
                          Create My Server
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  disabled={loading || (importSource === 'blossom' && !blossomConnected)}
                  onClick={handleImport}
                >
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Import Health Data
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="export" className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 border rounded-md cursor-pointer ${exportDestination === 'relay' ? 'border-primary bg-primary/5' : 'border-border'}`} 
                    onClick={() => setExportDestination('relay')}>
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Nostr Relays</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Export data to public Nostr relays</p>
                  </div>
                  
                  <div className={`p-4 border rounded-md cursor-pointer ${exportDestination === 'blossom' ? 'border-primary bg-primary/5' : 'border-border'}`}
                    onClick={() => setExportDestination('blossom')}>
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Blossom Server</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Export to your private Blossom server</p>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Select Data to Export</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(metricPrivacySettings).map(([metric, _]) => (
                      <div key={metric} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id={`export-${metric}`} 
                          className="rounded" 
                          defaultChecked 
                          aria-label={`Export ${metric} data`}
                        />
                        <Label htmlFor={`export-${metric}`}>{metric.charAt(0).toUpperCase() + metric.slice(1)}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {exportDestination === 'relay' && (
                  <div className="border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <p className="text-sm font-medium text-orange-500">
                        Warning: Data exported to relays will be public
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Only export data you're comfortable sharing publicly. Use the Privacy Settings tab to control which metrics are encrypted.
                    </p>
                  </div>
                )}
                
                {exportDestination === 'blossom' && !blossomConnected && (
                  <div className="border border-primary/20 rounded-md p-4 space-y-3 bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-start gap-3">
                      <Server className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-medium text-lg mb-1">Need a Private Blossom Server?</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Store your health data with maximum privacy on your own Blossom server.
                          Choose from different plans with various storage options and features.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="flex items-center gap-1.5 text-sm">
                            <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                            </div>
                            <span>One-click setup</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                            </div>
                            <span>Fully managed</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                            </div>
                            <span>Starting at 0.0005 BTC/mo</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                            </div>
                            <span>No technical skills needed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button 
                        variant="gradient" 
                        className="w-full" 
                        size="sm"
                        onClick={() => {
                          const tabElement = document.querySelector('[value="blossom-server"]') as HTMLElement;
                          if (tabElement) {
                            tabElement.click();
                          }
                        }}
                      >
                        <Server className="h-3.5 w-3.5 mr-2" />
                        Create My Server
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  disabled={loading || (exportDestination === 'blossom' && !blossomConnected)}
                  onClick={handleExport}
                >
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Export Health Data
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="privacy" className="space-y-6">
              <div className="border rounded-md p-4 mb-4">
                <h3 className="font-medium mb-2">Privacy Controls</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure where your health metrics are stored and how they're shared.
                </p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-4 text-sm font-medium pb-2 border-b">
                    <div>Metric</div>
                    <div>Storage</div>
                    <div>Public</div>
                    <div>Encrypted</div>
                  </div>
                  
                  {Object.entries(metricPrivacySettings).map(([metric, settings]) => (
                    <div key={metric} className="grid grid-cols-4 items-center py-2 border-b border-muted">
                      <div className="font-medium">
                        {metric.charAt(0).toUpperCase() + metric.slice(1)}
                      </div>
                      <div>
                        <Select 
                          value={settings.storage}
                          onValueChange={(value) => updateMetricStorage(metric, value as 'relay' | 'blossom' | 'drive')}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="relay">
                              <div className="flex items-center gap-2">
                                <Cloud className="h-3.5 w-3.5" />
                                <span>Relay</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="blossom">
                              <div className="flex items-center gap-2">
                                <Home className="h-3.5 w-3.5" />
                                <span>Blossom</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="drive">
                              <div className="flex items-center gap-2">
                                <Database className="h-3.5 w-3.5" />
                                <span>Encrypted Drive</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Switch 
                          checked={settings.isPublic}
                          onCheckedChange={() => toggleMetricPrivacy(metric, 'isPublic')}
                          aria-label={`Make ${metric} public`}
                        />
                      </div>
                      <div>
                        <Switch 
                          checked={settings.encrypted}
                          onCheckedChange={() => toggleMetricPrivacy(metric, 'encrypted')}
                          aria-label={`Encrypt ${metric} data`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Encryption Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Encrypted data uses NIP-44 encryption to ensure only you can access sensitive health information.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">NIP-44 Encryption</h4>
                    <p className="text-xs text-muted-foreground">For sensitive health data</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <Button className="w-full">
                Save Privacy Settings
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 