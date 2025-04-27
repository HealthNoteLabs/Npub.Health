import { useNostr } from "@/components/NostrProvider";
import { useMemo } from "react";
import { nip19 } from 'nostr-tools';

interface UseNostrProfileResult {
  name: string | null;
  displayName: string | null;
  picture: string | null;
  banner: string | null;
  about: string | null;
  nip05: string | null;
  npub: string | null;
  isLoading: boolean;
}

export function useNostrProfile(): UseNostrProfileResult {
  const { publicKey, profileMetadata } = useNostr();
  
  return useMemo(() => {
    const isLoading = !!publicKey && !profileMetadata;
    
    // Format npub for display (shortened version)
    let displayNpub = null;
    let npubEncoded = null;
    
    if (publicKey) {
      try {
        // Encode public key to npub format
        npubEncoded = nip19.npubEncode(publicKey);
        displayNpub = `${npubEncoded.substring(0, 8)}...${npubEncoded.substring(npubEncoded.length - 4)}`;
      } catch (error) {
        console.error('Error formatting npub:', error);
      }
    }
    
    return {
      name: profileMetadata?.name || null,
      displayName: profileMetadata?.name || displayNpub,
      picture: profileMetadata?.picture || null,
      banner: profileMetadata?.banner || null,
      about: profileMetadata?.about || null,
      nip05: profileMetadata?.nip05 || null,
      npub: npubEncoded,
      isLoading
    };
  }, [publicKey, profileMetadata]);
} 