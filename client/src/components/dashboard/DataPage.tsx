import React from 'react';
import DataManagement from './DataManagement';
import { useNostr } from '@/components/NostrProvider';

const DataPage: React.FC = () => {
  const { publicKey } = useNostr();

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please connect your Nostr account to manage your health data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Data Management</h1>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        Manage your health data, control where it's stored, and set privacy preferences. 
        You can import data from Nostr relays or Blossom servers, export data to various destinations,
        and control privacy settings for each metric type.
      </p>
      
      <DataManagement 
        connected={true} 
        relays={[]} 
        blossomConnected={false}
        blossomUrl=""
      />
    </div>
  );
};

export default DataPage; 