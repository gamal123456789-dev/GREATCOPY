import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

interface OrderDetails {
  id: string;
  serviceName: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Payment Success Page
 * Displays confirmation after successful Coinbase payment
 */
export default function PaymentSuccess() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { orderId } = router.query;

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (orderId) {
      fetchOrderDetails(orderId as string);
    }
  }, [session, status, orderId]);

  const fetchOrderDetails = async (orderIdParam: string) => {
    try {
      setLoading(true);
      
      // First try to fetch existing order
      const orderResponse = await fetch(`/api/orders/${orderIdParam}`);
      
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrder({
          id: orderData.id,
          serviceName: `${orderData.game} - ${orderData.service}`,
          amount: orderData.price,
          currency: 'USD',
          status: orderData.status.toUpperCase(),
          paymentMethod: 'Coinbase Commerce',
          createdAt: orderData.date
        });
        return;
      }
      
      // If order doesn't exist, show pending status and wait for webhook
      const urlParams = new URLSearchParams(window.location.search);
      const game = urlParams.get('game');
      const service = urlParams.get('service');
      const serviceDetails = urlParams.get('serviceDetails');
      const amount = urlParams.get('amount');
      
      if (!game || !service || !amount) {
        throw new Error('Missing payment details in URL');
      }
      
      // Show pending order details without creating the order
      // The order will be created by the webhook when payment is confirmed
      setOrder({
        id: orderIdParam,
        serviceName: `${game} - ${serviceDetails || service}`,
        amount: parseFloat(amount),
        currency: 'USD',
        status: 'PENDING',
        paymentMethod: 'Cryptomus',
        createdAt: new Date().toISOString()
      });
      
      // Poll for order creation (webhook should create it)
      const pollForOrder = async () => {
        let attempts = 0;
        const maxAttempts = 30; // Poll for 5 minutes (30 * 10 seconds)
        
        const poll = async () => {
          try {
            const response = await fetch(`/api/orders/${orderIdParam}`);
            if (response.ok) {
              const orderData = await response.json();
              setOrder({
                id: orderData.id,
                serviceName: `${orderData.game} - ${orderData.service}`,
                amount: orderData.price,
                currency: 'USD',
                status: orderData.status.toUpperCase(),
                paymentMethod: orderData.paymentMethod || 'Cryptomus',
                createdAt: orderData.date
              });
              return true;
            }
          } catch (error) {
            console.log('Polling for order...', attempts + 1);
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 10000); // Poll every 10 seconds
          } else {
            setError('Payment is being processed. Please check your orders page in a few minutes.');
          }
          return false;
        };
        
        poll();
      };
      
      pollForOrder();
      
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Failed to process payment confirmation');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueShopping = () => {
    // Get the saved return URL from localStorage
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl) {
      // Clear the saved URL and redirect to it
      localStorage.removeItem('returnUrl');
      window.location.href = returnUrl;
    } else {
      // Fallback to router.back() if no saved URL
      router.back();
    }
  };

  const handleViewOrders = () => {
    router.push('/orders');
  };

  // Removed handleRetryPayment function as retry payment is no longer available

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 text-center border border-gray-700">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleContinueShopping}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              order?.status === 'PENDING' ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {order?.status === 'PENDING' ? (
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {order?.status === 'PENDING' ? 'Payment Stopped' : 'Payment Successful!'}
            </h1>
            <p className="text-gray-300">
              {order?.status === 'PENDING' 
                ? 'Payment process has been stopped. Please contact our support team to complete your order.'
                : 'Thank you for your purchase. Your payment has been processed successfully.'
              }
            </p>
          </div>

          {/* Order Details */}
          {order && (
            <div className="border-t border-gray-600 pt-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Order Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order ID:</span>
                  <span className="font-mono text-sm text-white">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Service:</span>
                  <span className="text-white">{order.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-semibold">
                    {order.amount} {order.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Method:</span>
                  <span className="text-white">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'COMPLETED' 
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'PROCESSING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                {order.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Completed:</span>
                    <span className="text-white">
                      {new Date(order.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {order?.status === 'PENDING' || order?.status === 'FAILED' ? (
              <button
                onClick={() => window.open('https://discord.gg/ecnayG8yND', '_blank')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Contact Support
              </button>
            ) : (
              <button
                onClick={handleViewOrders}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View My Orders
              </button>
            )}
            <button
              onClick={handleContinueShopping}
              className="w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Continue Shopping
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-blue-900 bg-opacity-50 rounded-lg border border-blue-700">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">What's Next?</p>
                <p>Please go to your orders page. Someone from our team will contact you shortly to process your order.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}