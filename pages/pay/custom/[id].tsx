import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useOrders } from '../../../context/OrdersContext';

interface CustomPaymentRequest {
  id: string;
  customerEmail: string;
  description: string;
  amount: number;
  status: string;
  dueDate?: string;
  createdAt: string;
}

export default function CustomPaymentPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const { addOrder } = useOrders();
  
  const [paymentRequest, setPaymentRequest] = useState<CustomPaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('coinbase');

  useEffect(() => {
    if (id) {
      loadPaymentRequest();
    }
  }, [id]);

  const loadPaymentRequest = async () => {
    try {
      const response = await fetch(`/api/pay/custom/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPaymentRequest(data);
      } else if (response.status === 404) {
        setError('Payment request not found or has expired.');
      } else {
        setError('Failed to load payment request.');
      }
    } catch (error) {
      console.error('Error loading payment request:', error);
      setError('Failed to load payment request.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!session) {
      router.push('/auth');
      return;
    }

    if (!paymentRequest) return;

    setProcessing(true);
    try {
      // Handle contact support option
      if (selectedPaymentMethod === 'contact') {
        alert('Please contact our support team for alternative payment methods:\n\nEmail: support@example.com\nDiscord: YourDiscord#1234\nTelegram: @YourTelegram\n\nWe will assist you with your payment!');
        return;
      }

      // Step 1: Process real payment
      const paymentData = {
        amount: paymentRequest.amount,
        currency: 'USD',
        game: 'Custom Service',
        service: paymentRequest.description,
        paymentMethod: selectedPaymentMethod
      };

      const paymentResponse = await fetch('/api/pay/coinbase/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!paymentResponse.ok) {
        throw new Error('Payment processing failed');
      }

      const paymentResult = await paymentResponse.json();
      console.log('Payment processed:', paymentResult);

      // Check if we have a payment URL to redirect to (Coinbase)
                if (paymentResult.paymentUrl || paymentResult.payment_url) {
                    // Redirect to hosted payment page
                    window.location.href = paymentResult.paymentUrl || paymentResult.payment_url;
                    return;
                }

      // For successful payments without redirect
      if (paymentResult.success) {
        alert('Payment processed successfully!');
        console.log('Charge ID:', paymentResult.charge_id);
      }

      // Step 2: Mark payment request as paid and create order
      const updateResponse = await fetch(`/api/pay/custom/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: paymentResult.charge_id || paymentResult.transactionId,
          paymentMethod: 'coinbase'
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update payment status');
      }

      const updatedRequest = await updateResponse.json();

      // Step 3: Create order
      const order = {
        id: paymentResult.charge_id || paymentResult.transactionId,
        customerName: session.user.username || session.user.email.split('@')[0],
        game: 'Custom Service',
        service: paymentRequest.description,
        status: ((paymentResult.paymentUrl || paymentResult.payment_url) ? 'pending' : 'pending') as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        price: paymentRequest.amount,
        date: new Date().toISOString(),
      };

      const orderCreated = await addOrder(order);
      if (orderCreated) {
        // Redirect to orders page only if no payment URL
        if (!(paymentResult.paymentUrl || paymentResult.payment_url)) {
          router.push('/orders');
        }
      } else {
        alert('Payment processed successfully, but failed to create order record. Please contact support.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading payment request...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500 text-red-400 p-6 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!paymentRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Payment request not found.</div>
      </div>
    );
  }

  if (paymentRequest.status === 'paid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-green-500/20 border border-green-500 text-green-400 p-6 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Already Paid</h2>
          <p>This payment request has already been completed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
      <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-8 rounded-2xl border border-slate-700/50 shadow-2xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Payment Request</h1>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <p className="text-white bg-slate-700 p-3 rounded-lg">{paymentRequest.description}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
            <p className="text-white bg-slate-700 p-3 rounded-lg font-bold text-xl">${paymentRequest.amount.toFixed(2)}</p>
          </div>
          
          {paymentRequest.dueDate && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
              <p className="text-white bg-slate-700 p-3 rounded-lg">
                {new Date(paymentRequest.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {!session ? (
          <div className="text-center">
            <p className="text-gray-400 mb-4">Please log in to complete payment</p>
            <button
              onClick={() => router.push('/auth')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Log In
            </button>
          </div>
        ) : (
          <div>
            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Payment Method</label>
              <div className="space-y-2">
                <label className="flex items-center p-3 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="coinbase"
                    checked={selectedPaymentMethod === 'coinbase'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mr-3 text-blue-500"
                  />
                  <div className="flex items-center">
                    <span className="text-white font-medium">Coinbase Commerce</span>
                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">Crypto</span>
                  </div>
                </label>
                
                <label className="flex items-center p-3 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="contact"
                    checked={selectedPaymentMethod === 'contact'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mr-3 text-blue-500"
                  />
                  <div>
                    <span className="text-white font-medium">Other Payment Methods</span>
                    <p className="text-xs text-gray-400 mt-1">Contact support for alternatives</p>
                  </div>
                </label>
              </div>
            </div>
            
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300"
            >
              {processing ? 'Processing Payment...' : selectedPaymentMethod === 'contact' ? 'Contact Support' : `Pay $${paymentRequest.amount.toFixed(2)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}