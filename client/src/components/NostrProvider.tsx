import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { nip19 } from 'nostr-tools';
import { pool, RELAYS, checkNostrAvailability, fetchProfileMetadata, ProfileMetadata } from '@/lib/nostr';
import { useToast } from '@/hooks/use-toast';

interface NostrContextType {
  publicKey: string | null;
  profileMetadata: ProfileMetadata | null;
  login: () => Promise<void>;
  logout: () => void;
}

const NostrContext = createContext<NostrContextType>({} as NostrContextType);

export const useNostr = () => useContext(NostrContext);

export function NostrProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [profileMetadata, setProfileMetadata] = useState<ProfileMetadata | null>(null);
  const { toast } = useToast();

  // Check for Nostr extension on component mount
  useEffect(() => {
    console.log('NostrProvider mounted, checking for Nostr extension...');
    const hasNostr = checkNostrAvailability();
    console.log('Nostr extension available:', hasNostr);
  }, []);

  // Fetch profile metadata when publicKey changes
  useEffect(() => {
    if (publicKey) {
      fetchProfileMetadata(publicKey)
        .then(metadata => {
          console.log('Fetched profile metadata:', metadata);
          setProfileMetadata(metadata);
        })
        .catch(error => {
          console.error('Error fetching profile metadata:', error);
        });
    } else {
      setProfileMetadata(null);
    }
  }, [publicKey]);

  // Helper function to add a timeout to a promise
  const withTimeout = (promise: Promise<any>, timeoutMs: number, errorMessage: string) => {
    let timeoutHandle: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    return Promise.race([
      promise,
      timeoutPromise
    ]).finally(() => clearTimeout(timeoutHandle));
  };

  const login = useCallback(async () => {
    console.log('Login function called');
    try {
      // Force a re-check for window.nostr in case it was initialized after page load
      const hasNostr = typeof window.nostr !== 'undefined';
      console.log('Found window.nostr:', hasNostr);
      
      // Explicitly check for window.nostr before proceeding
      if (!hasNostr || !window.nostr) {
        console.error('No window.nostr object found');
        toast({
          variant: "destructive",
          title: "Nostr Extension Required",
          description: "Please install a Nostr extension (like nos2x or Alby) to continue."
        });
        throw new Error('No Nostr extension found');
      }

      console.log('Found window.nostr, attempting to get public key...');
      
      // Make sure getPublicKey is a function
      if (typeof window.nostr?.getPublicKey !== 'function') {
        console.error('window.nostr.getPublicKey is not a function');
        toast({
          variant: "destructive",
          title: "Incompatible Nostr Extension",
          description: "Your Nostr extension doesn't support the required methods."
        });
        throw new Error('getPublicKey is not a function');
      }

      // Call getPublicKey with try/catch to capture any internal errors
      // Add a timeout to prevent hanging if the extension doesn't respond
      let pubkey;
      try {
        pubkey = await withTimeout(
          window.nostr.getPublicKey(),
          15000, // 15 second timeout (increased from 5s)
          "Nostr extension did not respond in time. Try again or reload the page."
        );
        console.log('Public key retrieved:', pubkey);
      } catch (pkError) {
        console.error('Error getting public key:', pkError);
        
        // Check if the error is a timeout
        const isTimeout = pkError instanceof Error && 
          pkError.message.includes('did not respond in time');
        
        toast({
          variant: "destructive",
          title: isTimeout ? "Connection Timeout" : "Permission Denied",
          description: isTimeout 
            ? "Your Nostr extension didn't respond in time. Please make sure it's unlocked and try again, or try a different Nostr extension." 
            : "Failed to get public key from your Nostr extension. Try again or reload the page."
        });
        throw pkError;
      }

      if (!pubkey) {
        console.error('No public key returned');
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: "No public key was returned by your Nostr extension."
        });
        throw new Error('Failed to get public key');
      }

      setPublicKey(pubkey);
      console.log('Public key set in state');

      // Connect to relays
      console.log('Connecting to relays:', RELAYS);
      try {
        const relayPromises = RELAYS.map(async (relay) => {
          try {
            console.log(`Connecting to relay: ${relay}`);
            await pool.ensureRelay(relay);
            console.log(`Successfully connected to relay: ${relay}`);
            return { relay, success: true };
          } catch (err) {
            console.error(`Failed to connect to relay ${relay}:`, err);
            return { relay, success: false, error: err };
          }
        });

        const relayResults = await Promise.all(relayPromises);
        const successfulRelays = relayResults.filter(r => r.success).length;
        
        console.log(`Connected to ${successfulRelays}/${RELAYS.length} relays`);
        
        if (successfulRelays > 0) {
          toast({
            title: "Connected Successfully",
            description: `Your Nostr account is now connected (${successfulRelays}/${RELAYS.length} relays).`
          });
        } else {
          toast({
            variant: "destructive",
            title: "Connected with No Relays",
            description: "Connected to your account but couldn't connect to any relays."
          });
        }
      } catch (relayError) {
        console.error('Relay connection error:', relayError);
        toast({
          title: "Connected with Limited Functionality",
          description: "Connected to your account but some relays might be unavailable."
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Nostr"
      });
      throw error;
    }
  }, [toast]);

  const logout = useCallback(() => {
    console.log('Logout function called');
    setPublicKey(null);
    setProfileMetadata(null);
    pool.close(RELAYS);
    toast({
      title: "Disconnected",
      description: "You've been logged out of your Nostr account."
    });
  }, [toast]);

  return (
    <NostrContext.Provider value={{ publicKey, profileMetadata, login, logout }}>
      {children}
    </NostrContext.Provider>
  );
}