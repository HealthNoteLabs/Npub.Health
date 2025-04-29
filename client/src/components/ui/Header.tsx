import React, { useState } from 'react';
import { useNostr } from '../../components/NostrProvider';
import { nip19 } from 'nostr-tools';
import { debugNostr } from '../../lib/nostr';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { useNostrProfile } from '@/hooks/use-nostr-profile';

const Header: React.FC = () => {
  const { publicKey, login, logout } = useNostr();
  const { name, picture, displayName, isLoading } = useNostrProfile();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  
  // Get initials for avatar fallback
  const getInitials = () => {
    if (name) {
      return name
        .split(' ')
        .map(name => name[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return publicKey ? publicKey.substring(0, 2) : '??';
  };

  const handleDebug = async () => {
    console.log('Starting Nostr debug...');
    await debugNostr();
  };

  const handleLogin = async () => {
    console.log('Attempting to connect to Nostr...');
    setIsConnecting(true);
    setConnectionFailed(false);
    
    try {
      await login();
      setConnectionFailed(false);
    } catch (error) {
      console.error('Login failed:', error);
      setConnectionFailed(true);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto p-4 flex justify-between items-center max-w-6xl">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-blue-600">Npub.Health</h1>
          <span className="text-sm text-gray-500">v1.0</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {publicKey ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className={isLoading ? "opacity-60" : ""}>
                  {picture ? (
                    <AvatarImage src={picture} alt={name || 'Profile'} />
                  ) : null}
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{displayName}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLogin}
                disabled={isConnecting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isConnecting 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isConnecting ? 'Connecting...' : 'Connect to Nostr'}
              </button>
              
              {connectionFailed && (
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Retry Connection
                </button>
              )}
            </div>
          )}
          
          <button
            onClick={handleDebug}
            className="px-3 py-1 border border-gray-300 rounded shadow-sm text-xs font-medium text-gray-600 bg-white hover:bg-gray-50"
            title="Run Nostr diagnostics in console"
          >
            Debug
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 