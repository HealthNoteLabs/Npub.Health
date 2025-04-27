import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkNostrAvailability } from './nostr';
import { nip19 } from 'nostr-tools';

interface NostrContextType {
  isAuthenticated: boolean;
  publicKey: string | null;
  npub: string | null;
  login: () => Promise<void>;
  logout: () => void;
}

const NostrContext = createContext<NostrContextType>({
  isAuthenticated: false,
  publicKey: null,
  npub: null,
  login: async () => {},
  logout: () => {}
});

export const useNostr = () => useContext(NostrContext);

interface NostrProviderProps {
  children: ReactNode;
}

export const NostrProvider: React.FC<NostrProviderProps> = ({ children }) => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [npub, setNpub] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for stored public key on mount
  useEffect(() => {
    const storedPublicKey = localStorage.getItem('nostr_pubkey');
    if (storedPublicKey) {
      setPublicKey(storedPublicKey);
      setNpub(nip19.npubEncode(storedPublicKey));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async () => {
    if (!checkNostrAvailability()) {
      alert('Nostr extension not found. Please install a Nostr extension like nos2x or Alby.');
      return;
    }

    try {
      const pk = await window.nostr!.getPublicKey();
      setPublicKey(pk);
      setNpub(nip19.npubEncode(pk));
      setIsAuthenticated(true);
      localStorage.setItem('nostr_pubkey', pk);
    } catch (error) {
      console.error('Error during Nostr login:', error);
      alert('Failed to connect to Nostr. Please try again.');
    }
  };

  const logout = () => {
    setPublicKey(null);
    setNpub(null);
    setIsAuthenticated(false);
    localStorage.removeItem('nostr_pubkey');
  };

  return (
    <NostrContext.Provider
      value={{
        isAuthenticated,
        publicKey,
        npub,
        login,
        logout
      }}
    >
      {children}
    </NostrContext.Provider>
  );
};

export default NostrProvider; 