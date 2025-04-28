import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

interface DataManagementProps {
  connected?: boolean;
  relays?: string[];
  blossomConnected?: boolean;
  blossomUrl?: string;
}

export default function DataManagement({
  connected = false,
  relays = [],
  blossomConnected = false,
  blossomUrl = ''
}: DataManagementProps) {
  const [activeTab, setActiveTab] = useState('import');
  const [importSource, setImportSource] = useState('relay');
  const [exportDestination, setExportDestination] = useState('relay');
  const [customRelayUrl, setCustomRelayUrl] = useState('');
  const [customBlossomUrl, setCustomBlossomUrl] = useState(blossomUrl || '');
  const [loading, setLoading] = useState(false);
  const [metricPrivacySettings, setMetricPrivacySettings] = useState({
    weight: { isPublic: false, encrypted: true },
    height: { isPublic: false, encrypted: true },
    age: { isPublic: false, encrypted: true },
    gender: { isPublic: false, encrypted: true },
    fitnessLevel: { isPublic: true, encrypted: false },
    workouts: { isPublic: true, encrypted: false },
    running: { isPublic: true, encrypted: false },
    meditation: { isPublic: true, encrypted: false },
    habits: { isPublic: true, encrypted: false },
    sleep: { isPublic: false, encrypted: true },
    nutrition: { isPublic: false, encrypted: true },
    spiritual: { isPublic: true, encrypted: false },
    lifting: { isPublic: true, encrypted: false }
  });

  // These functions would connect to actual API endpoints in a real implementation
  const handleImport = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Show success notification
      alert('Data imported successfully');
    }, 2000);
  };

  const handleExport = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Show success notification
      alert('Data exported successfully');
    }, 2000);
  };

  const handleConnectBlossom = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Show success notification
      alert('Connected to Blossom server');
    }, 2000);
  };

  const handleConnectRelay = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Show success notification
      alert('Connected to custom relay');
    }, 2000);
  };

  const toggleMetricPrivacy = (metric: string, setting: 'isPublic' | 'encrypted') => {
    setMetricPrivacySettings(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric as keyof typeof prev],
        [setting]: !prev[metric as keyof typeof prev][setting]
      }
    }));
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
                  <div className="border rounded-md p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Blossom Server Status</h3>
                      {blossomConnected ? (
                        <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">Connected</span>
                      ) : (
                        <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full">Not Connected</span>
                      )}
                    </div>
                    
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
                        <Select defaultValue={settings.isPublic ? "relay" : "blossom"}>
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