import React, { useState } from 'react';
import { useNostr } from '../../components/NostrProvider';
import { nip19 } from 'nostr-tools';
import { debugNostr } from '../../lib/nostr';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { useNostrProfile } from '@/hooks/use-nostr-profile';
import { Button } from './button';
import { LogOut, Menu, LifeBuoy, ChevronDown, Moon, Sun, Database, X } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header: React.FC = () => {
  const { publicKey, login, logout } = useNostr();
  const { name, picture, displayName, isLoading } = useNostrProfile();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const { theme, setTheme } = useTheme();
  
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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Navigation Links
  const navLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/workouts", label: "Workouts" },
    { to: "/analytics", label: "Analytics" },
    { to: "/insights", label: "Insights" },
    { to: "/data", label: "Data" }
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/40 shadow-sm">
      <div className="container h-16 mx-auto flex justify-between items-center max-w-6xl px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-gradient-health flex items-center justify-center text-white font-bold text-lg">N</div>
            <h1 className="text-xl font-bold gradient-text hidden sm:block">Npub.Health</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden sm:flex"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          {publicKey ? (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-8">
                    <Avatar className={`h-8 w-8 ${isLoading ? "opacity-60" : ""}`}>
                      {picture ? (
                        <AvatarImage src={picture} alt={name || 'Profile'} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm hidden md:inline-block">{displayName || 'Your Profile'}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{displayName || 'User'}</p>
                      {publicKey && (
                        <p className="w-[200px] truncate text-xs text-muted-foreground">
                          {`npub:${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 4)}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="gradient"
                size={connectionFailed ? "sm" : "default"}
                onClick={handleLogin}
                isLoading={isConnecting}
              >
                {!isConnecting && 'Connect Nostr'}
              </Button>
              
              {connectionFailed && (
                <Button
                  onClick={handleLogin}
                  variant="destructive"
                  size="sm"
                >
                  Retry
                </Button>
              )}
            </div>
          )}
          
          <Button
            onClick={handleDebug}
            variant="ghost"
            size="icon"
            title="Run Nostr diagnostics in console"
          >
            <LifeBuoy className="h-5 w-5" />
          </Button>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold">Menu</h2>
                  <Button
                    onClick={toggleTheme}
                    variant="ghost"
                    size="icon"
                  >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </div>
                
                <div className="flex flex-col space-y-4">
                  {navLinks.map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-sm font-medium py-2 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                
                <div className="mt-auto pt-4 border-t border-border">
                  {publicKey ? (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          {picture ? <AvatarImage src={picture} /> : null}
                          <AvatarFallback>{getInitials()}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate">{displayName || 'User'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {publicKey ? `npub:${publicKey.substring(0, 6)}...` : ''}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={logout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={handleLogin}
                      isLoading={isConnecting}
                    >
                      {!isConnecting && 'Connect Nostr'}
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header; 