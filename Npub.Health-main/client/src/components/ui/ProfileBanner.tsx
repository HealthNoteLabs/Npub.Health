import React from 'react';
import { useNostrProfile } from '@/hooks/use-nostr-profile';

interface ProfileBannerProps {
  className?: string;
}

export function ProfileBanner({ className = '' }: ProfileBannerProps) {
  const { banner, isLoading } = useNostrProfile();
  
  // Skip rendering if no banner
  if (!banner) {
    return null;
  }
  
  return (
    <div className={`w-full relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/30 z-10"></div>
      <img 
        src={banner} 
        alt="Profile Banner" 
        className={`w-full h-32 md:h-48 object-cover ${isLoading ? 'opacity-60' : ''}`}
      />
    </div>
  );
}

export default ProfileBanner; 