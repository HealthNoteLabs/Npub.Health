import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RefreshCw, Download, AlertCircle } from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface ServerLogsProps {
  serverId: string;
  userPubkey: string;
}

interface LogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'error' | 'warning';
}

const ServerLogs: React.FC<ServerLogsProps> = ({ serverId, userPubkey }) => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('deployment');
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/blossom/logs/${serverId}?userPubkey=${userPubkey}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Failed to Load Logs",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load logs when component mounts
  useEffect(() => {
    fetchLogs();
    
    // Set up polling for fresh logs
    const interval = setInterval(fetchLogs, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [serverId, userPubkey]);

  const downloadLogs = () => {
    const logText = logs.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `server-logs-${serverId}-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Server Logs</CardTitle>
            <CardDescription>View deployment and runtime logs for your server</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={downloadLogs} disabled={loading || logs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="deployment">Deployment Logs</TabsTrigger>
            <TabsTrigger value="runtime">Runtime Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deployment" className="space-y-4">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No deployment logs available</p>
              </div>
            ) : (
              <div className="h-80 overflow-auto bg-gray-100 dark:bg-gray-900 rounded p-3 font-mono text-xs">
                {logs.map((log, index) => (
                  <div key={index} className="py-1 border-b border-gray-200 dark:border-gray-800">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="runtime" className="space-y-4">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No runtime logs available</p>
              </div>
            ) : (
              <div className="h-80 overflow-auto bg-gray-100 dark:bg-gray-900 rounded p-3 font-mono text-xs">
                {logs.map((log, index) => (
                  <div key={index} className="py-1 border-b border-gray-200 dark:border-gray-800">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ServerLogs; 