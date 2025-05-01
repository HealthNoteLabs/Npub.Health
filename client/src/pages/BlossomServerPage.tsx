import React from 'react';
import BlossomServerManager from '@/components/dashboard/BlossomServerManager';
import { useNostr } from '@/components/NostrProvider';

const BlossomServerPage: React.FC = () => {
  const { publicKey } = useNostr();

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please connect your Nostr account to manage your Blossom server.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Blossom Server Management</h1>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        Create and manage your own private Blossom server for secure health data storage.
        With your own server, you have complete control over your health data, ensuring maximum
        privacy and security through end-to-end encryption.
      </p>
      
      <BlossomServerManager />
    </div>
  );
};

export default BlossomServerPage; 