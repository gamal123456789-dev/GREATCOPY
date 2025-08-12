import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../components/Layout';

interface OrderDetails {
  id: string;
  serviceName: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

/**
 * Payment Failed Page
 * Displays error message and options after failed Coinbase payment
 */
export default function PaymentFailed() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const { order_id } = router.query;

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (order_id) {
      fetchOrderDetails(order_id as string);
    }
  }, [session, status, order_id]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    
    try {
      setRetrying(true);
      
      // Create a new payment for the same service
      const response = await fetch('/api/pay/coinbase/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: order.amount,
          currency: order.currency,
          serviceId: order.id,
          serviceName: order.serviceName,
          description: `Retry payment for ${order.serviceName}`
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to new payment URL
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || 'Failed to create retry payment');
      }
    } catch (err) {
      console.error('Retry payment error:', err);
      alert('Failed to retry payment. Please try again or contact support.');
    } finally {
      setRetrying(false);
    }
  };

  const handleBackToServices = () => {
    router.push('/');
  };

  const handleContactSupport = () => {
    router.push('/contact');
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          {/* Error Icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600">
              We're sorry, but your payment could not be processed. Please try again or contact our support team.
            </p>
          </div>

          {/* Order Details */}
          {order && (
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-sm text-gray-900">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="text-gray-900">{order.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-gray-900 font-semibold">
                    {order.amount} {order.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {order.status}
                  </span>
                </div>
                {order.notes && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      <span className="font-medium">Reason: </span>
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {order && (
              <button
                onClick={handleRetryPayment}
                disabled={retrying}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center justify-center"
              >
                {retrying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Try Payment Again'
                )}
              </button>
            )}
            
            <button
              onClick={handleContactSupport}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Contact Support
            </button>
            
            <button
              onClick={handleBackToServices}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Back to Services
            </button>
          </div>

          {/* Common Issues */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Common Issues:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Insufficient funds in your wallet</li>
                  <li>Network congestion or timeout</li>
                  <li>Incorrect payment amount</li>
                  <li>Payment window expired</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Support Info */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Need Help?</p>
                <p>Our support team is available 24/7 to assist you with payment issues.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}