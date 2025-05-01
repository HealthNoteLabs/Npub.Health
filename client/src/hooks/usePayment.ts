import { useState, useEffect } from 'react';
import { PaymentDetails } from '@/components/payment/PaymentModal';

export enum PaymentStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  PAID = 'paid',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

interface UsePaymentOptions {
  pollingInterval?: number;
  onStatusChange?: (status: PaymentStatus) => void;
  onPaymentSuccess?: () => void;
}

export function usePayment(options: UsePaymentOptions = {}) {
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.IDLE);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [polling, setPolling] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    pollingInterval = 5000, 
    onStatusChange,
    onPaymentSuccess 
  } = options;
  
  // Check payment status
  const checkPaymentStatus = async () => {
    if (!paymentDetails?.invoiceId) return;
    
    try {
      const response = await fetch(`/api/blossom/payment/${paymentDetails.invoiceId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }
      
      const data = await response.json();
      const newStatus = data.status as PaymentStatus;
      
      if (newStatus !== status) {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
        
        if (newStatus === PaymentStatus.PAID) {
          stopPolling();
          onPaymentSuccess?.();
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      setError('Failed to check payment status');
      return null;
    }
  };
  
  // Start polling
  const startPolling = () => {
    if (polling) stopPolling();
    
    const interval = setInterval(checkPaymentStatus, pollingInterval);
    setPolling(interval);
    return interval;
  };
  
  // Stop polling
  const stopPolling = () => {
    if (polling) {
      clearInterval(polling);
      setPolling(null);
    }
  };
  
  // Open payment modal
  const openPaymentModal = (details: PaymentDetails) => {
    setPaymentDetails(details);
    setStatus(PaymentStatus.PENDING);
    setIsModalOpen(true);
    setError(null);
    startPolling();
  };
  
  // Close payment modal
  const closePaymentModal = () => {
    setIsModalOpen(false);
    
    // If not paid or expired, cancel payment
    if (status === PaymentStatus.PENDING && paymentDetails?.invoiceId) {
      // Could add API call to cancel payment
    }
  };
  
  // Handle payment success
  const handlePaymentSuccess = () => {
    setStatus(PaymentStatus.PAID);
    stopPolling();
    onPaymentSuccess?.();
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);
  
  return {
    status,
    paymentDetails,
    isModalOpen,
    error,
    openPaymentModal,
    closePaymentModal,
    checkPaymentStatus,
    handlePaymentSuccess
  };
} 