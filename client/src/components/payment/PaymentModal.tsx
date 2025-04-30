import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useToast } from '@/components/ui/use-toast';

export interface PaymentDetails {
  serverId: string;
  invoiceId: string;
  paymentAmount: number;
  paymentAddress: string;
  paymentUrl: string;
  lightningInvoice?: string;
  expiresAt: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentDetails: PaymentDetails | null;
  onPaymentSuccess: () => void;
}

enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

export function PaymentModal({ isOpen, onClose, paymentDetails, onPaymentSuccess }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<string>("bitcoin");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Copy text to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  // Format expiration time
  const formatExpiryTime = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins <= 0) {
      return 'Expired';
    }
    
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  };

  // Check payment status
  const checkPaymentStatus = async () => {
    if (!paymentDetails?.invoiceId) return;
    
    setIsCheckingStatus(true);
    
    try {
      const response = await fetch(`/api/blossom/payment/${paymentDetails.invoiceId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }
      
      const data = await response.json();
      
      // Update status
      setPaymentStatus(data.status as PaymentStatus);
      
      // If paid, trigger success callback
      if (data.status === PaymentStatus.PAID) {
        onPaymentSuccess();
        
        // Stop polling
        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
        
        toast({
          title: "Payment Received!",
          description: "Your payment has been confirmed. Your server will be deployed soon.",
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast({
        title: "Error",
        description: "Failed to check payment status",
        variant: "destructive"
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Start polling for payment status
  useEffect(() => {
    if (isOpen && paymentDetails?.invoiceId) {
      // Initial check
      checkPaymentStatus();
      
      // Start polling every 5 seconds
      const interval = setInterval(checkPaymentStatus, 5000);
      setPollInterval(interval);
      
      return () => {
        clearInterval(interval);
        setPollInterval(null);
      };
    }
  }, [isOpen, paymentDetails]);

  // Clear interval when component unmounts
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  // If there are no payment details, don't render the content
  if (!paymentDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Error</DialogTitle>
            <DialogDescription>
              No payment details found. Please try again.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Required</DialogTitle>
          <DialogDescription>
            Pay with Bitcoin to continue with server deployment
          </DialogDescription>
        </DialogHeader>
        
        {paymentStatus === PaymentStatus.PAID ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Payment Confirmed!</h3>
            <p className="text-center text-sm text-muted-foreground">
              Your payment has been received. Your server will be deployed shortly.
            </p>
            <Button onClick={onClose}>Continue</Button>
          </div>
        ) : paymentStatus === PaymentStatus.EXPIRED ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold">Payment Expired</h3>
            <p className="text-center text-sm text-muted-foreground">
              The payment time has expired. Please generate a new payment request.
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-center">
              <div className="text-lg font-bold">{paymentDetails.paymentAmount} BTC</div>
              <div className="text-sm text-muted-foreground mt-1">
                Expires in: {formatExpiryTime(paymentDetails.expiresAt)}
              </div>
            </div>
            
            <Tabs defaultValue="bitcoin" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bitcoin">Bitcoin</TabsTrigger>
                <TabsTrigger value="lightning" disabled={!paymentDetails.lightningInvoice}>
                  Lightning
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="bitcoin" className="space-y-4">
                {paymentDetails.paymentAddress ? (
                  <>
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <QRCode 
                        value={`bitcoin:${paymentDetails.paymentAddress}?amount=${paymentDetails.paymentAmount}`}
                        size={200}
                      />
                    </div>
                    
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full p-2 pr-20 border rounded-md font-mono text-sm"
                        value={paymentDetails.paymentAddress}
                        readOnly
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-1 top-1"
                        onClick={() => copyToClipboard(paymentDetails.paymentAddress, 'Bitcoin address')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(paymentDetails.paymentUrl, '_blank')}
                      >
                        Open in Wallet <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 mx-auto text-amber-500" />
                    <p className="mt-2">Bitcoin address not available</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="lightning" className="space-y-4">
                {paymentDetails.lightningInvoice ? (
                  <>
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <QRCode 
                        value={paymentDetails.lightningInvoice}
                        size={200}
                      />
                    </div>
                    
                    <div className="relative">
                      <textarea
                        className="w-full p-2 pr-20 border rounded-md font-mono text-sm h-24 resize-none"
                        value={paymentDetails.lightningInvoice}
                        readOnly
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-1 top-1"
                        onClick={() => copyToClipboard(paymentDetails.lightningInvoice!, 'Lightning invoice')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`lightning:${paymentDetails.lightningInvoice}`, '_blank')}
                      >
                        Open in Wallet <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 mx-auto text-amber-500" />
                    <p className="mt-2">Lightning invoice not available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkPaymentStatus}
                disabled={isCheckingStatus}
              >
                {isCheckingStatus ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking payment...
                  </>
                ) : (
                  <>I've made the payment</>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 