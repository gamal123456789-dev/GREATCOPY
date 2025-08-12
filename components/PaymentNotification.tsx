import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface PaymentNotificationProps {
  type: 'success' | 'error';
  message: string;
  orderId?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

/**
 * Payment Notification Component
 * Shows success or error notifications for payment processing
 */
export default function PaymentNotification({
  type,
  message,
  orderId,
  onClose,
  autoClose = true,
  duration = 5000
}: PaymentNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const handleViewOrder = () => {
    if (orderId) {
      router.push(`/orders?highlight=${orderId}`);
    } else {
      router.push('/orders');
    }
  };

  const handleContactSupport = () => {
    window.open('https://discord.gg/s88WnxvG', '_blank');
  };

  if (!isVisible) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
  const borderColor = isSuccess ? 'border-green-400' : 'border-red-400';
  const textColor = isSuccess ? 'text-green-100' : 'text-red-100';
  const iconColor = isSuccess ? 'text-green-200' : 'text-red-200';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div className={`${bgColor} ${borderColor} border rounded-lg shadow-2xl p-4 transform transition-all duration-300 animate-slide-in`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {isSuccess ? (
              <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-semibold ${textColor}`}>
              {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
            </h3>
            <p className={`text-sm ${textColor} mt-1 opacity-90`}>
              {message}
            </p>
            
            {orderId && (
              <p className={`text-xs ${textColor} mt-2 opacity-75 font-mono`}>
                Order ID: {orderId}
              </p>
            )}
            
            <div className="mt-3 flex space-x-2">
              {isSuccess ? (
                <button
                  onClick={handleViewOrder}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded transition-colors duration-200"
                >
                  View Order
                </button>
              ) : (
                <button
                  onClick={handleContactSupport}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded transition-colors duration-200"
                >
                  Contact Support
                </button>
              )}
              
              <button
                onClick={handleClose}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className={`ml-2 ${textColor} hover:opacity-75 transition-opacity duration-200`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}