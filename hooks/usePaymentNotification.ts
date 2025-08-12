import { useState, useCallback } from 'react';

interface NotificationState {
  isVisible: boolean;
  type: 'success' | 'error' | null;
  message: string;
  orderId?: string;
}

/**
 * Custom hook for managing payment notifications
 * Provides functions to show success/error notifications
 */
export function usePaymentNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    isVisible: false,
    type: null,
    message: '',
    orderId: undefined
  });

  const showSuccess = useCallback((message: string, orderId?: string) => {
    setNotification({
      isVisible: true,
      type: 'success',
      message,
      orderId
    });
  }, []);

  const showError = useCallback((message: string) => {
    setNotification({
      isVisible: true,
      type: 'error',
      message
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const handlePaymentSuccess = useCallback((orderId: string, serviceName?: string) => {
    const message = serviceName 
      ? `Your payment for ${serviceName} has been processed successfully! Your order is now being prepared.`
      : 'Your payment has been processed successfully! Your order is now being prepared.';
    
    showSuccess(message, orderId);
  }, [showSuccess]);

  const handlePaymentError = useCallback((error?: string) => {
    const message = error 
      ? `Payment failed: ${error}. Please try again or contact our support team.`
      : 'Payment processing failed. Please try again or contact our support team for assistance.';
    
    showError(message);
  }, [showError]);

  return {
    notification,
    showSuccess,
    showError,
    hideNotification,
    handlePaymentSuccess,
    handlePaymentError
  };
}