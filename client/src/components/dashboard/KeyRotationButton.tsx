import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCcw, KeyIcon, ShieldAlert, CheckCircle2 } from 'lucide-react';
import driveManager from '@/lib/driveManager';
import { useNostr } from '@/components/NostrProvider';

interface KeyRotationButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const KeyRotationButton: React.FC<KeyRotationButtonProps> = ({ 
  variant = 'outline',
  size = 'default'
}) => {
  const [open, setOpen] = useState(false);
  const [rotationInProgress, setRotationInProgress] = useState(false);
  const [rotationComplete, setRotationComplete] = useState(false);
  const { toast } = useToast();
  const { publicKey } = useNostr();

  const handleRotateKey = async () => {
    if (!publicKey) {
      toast({
        title: "No Nostr Account",
        description: "Please connect your Nostr account first",
        variant: "destructive"
      });
      return;
    }

    setRotationInProgress(true);
    
    try {
      // Call the actual key rotation function
      const success = await driveManager.rotateEncryptionKey(publicKey);
      
      if (success) {
        setRotationComplete(true);
        toast({
          title: "Key Rotation Complete",
          description: "Your encryption keys have been successfully rotated and all data re-encrypted.",
        });
      } else {
        throw new Error("Key rotation failed");
      }
    } catch (error) {
      console.error("Key rotation error:", error);
      toast({
        title: "Key Rotation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setRotationInProgress(false);
    }
  };

  const closeAndReset = () => {
    setOpen(false);
    setTimeout(() => setRotationComplete(false), 300);
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        onClick={() => setOpen(true)}
      >
        <KeyIcon className="h-4 w-4 mr-2" />
        Rotate Encryption Keys
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rotationComplete 
                ? "Key Rotation Complete" 
                : "Rotate Encryption Keys"}
            </DialogTitle>
            <DialogDescription>
              {rotationComplete 
                ? "Your encryption keys have been successfully rotated."
                : "This will generate new encryption keys and re-encrypt all your data. This process may take some time depending on how much data you have stored."}
            </DialogDescription>
          </DialogHeader>

          {rotationInProgress ? (
            <div className="flex flex-col items-center justify-center py-8">
              <RefreshCcw className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-center text-sm text-muted-foreground">
                Rotating keys and re-encrypting your data...
                <br />
                Please do not close this window.
              </p>
            </div>
          ) : rotationComplete ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-center text-sm">
                Your encryption keys have been successfully rotated and all data has been re-encrypted with the new keys.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-4">
                <ShieldAlert className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-1">Why rotate keys?</h4>
                  <p className="text-sm text-muted-foreground">
                    Regularly rotating your encryption keys is a security best practice. It limits the impact of key compromise and ensures forward secrecy of your health data.
                  </p>
                </div>
              </div>
              
              <div className="border rounded-md p-3 bg-yellow-50 dark:bg-yellow-950/50 text-sm space-y-2">
                <p className="font-medium text-yellow-800 dark:text-yellow-400">Important:</p>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  <li>This process cannot be interrupted once started</li>
                  <li>You'll need to stay on this page until completion</li>
                  <li>All your data will remain accessible after rotation</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            {rotationComplete ? (
              <Button onClick={closeAndReset}>Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={rotationInProgress}>
                  Cancel
                </Button>
                <Button onClick={handleRotateKey} disabled={rotationInProgress}>
                  {rotationInProgress && <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />}
                  Rotate Keys
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KeyRotationButton; 