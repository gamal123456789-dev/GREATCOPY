/**
 * Orders page - displays user's purchase history
 * Fetches and renders orders from the database
 * BACKEND FOCUS: Server-side data fetching with authentication
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { OrdersProvider, useOrders } from '../context/OrdersContext';
import ChatInterface from '../components/ChatInterface';
import PaymentSystem from '../components/PaymentSystem';
import { useAudioManager } from '../hooks/useAudioManager';
import { copyWithFeedback } from '../utils/clipboard';
import {
  ClipboardDocumentListIcon as ClipboardListIcon,
  CubeIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Helper function to format order ID
const formatOrderId = (id) => {
  if (!id || typeof id !== 'string') return 'N/A';
  return `O-${id.slice(0, 4).toUpperCase()}`;
};

function OrdersContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { orders, refreshOrders, addOrder } = useOrders();
  const { enableAudio } = useAudioManager();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState(null);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(1);

  // Handle orderId from URL query parameter
  useEffect(() => {
    if (router.query.orderId && orders.length > 0) {
      const orderId = router.query.orderId;
      // Check if the order exists in user's orders
      const orderExists = orders.find(order => order.id === orderId);
      if (orderExists) {
        setSelectedOrderForChat(orderId);
        // Clear the URL parameter after setting the selected order
        router.replace('/orders', undefined, { shallow: true });
      }
    }
  }, [router.query.orderId, orders, router]);


  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/auth');
      return;
    }

    // Load user's orders
    initializeOrders();
  }, [session, status, router]);

  // Enable audio on first user interaction
  useEffect(() => {
    const enableAudioOnInteraction = () => {
      enableAudio();
      console.log('🔊 Audio enabled on orders page');
      // Remove listeners after first interaction
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('keydown', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
    };

    // Add event listeners for user interaction
    document.addEventListener('click', enableAudioOnInteraction);
    document.addEventListener('keydown', enableAudioOnInteraction);
    document.addEventListener('touchstart', enableAudioOnInteraction);

    return () => {
      // Cleanup listeners
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('keydown', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
    };
  }, [enableAudio]);



  const initializeOrders = async () => {
    try {
      setLoading(true);
      await refreshOrders();
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };



  const handleTipSubmit = async () => {
    try {
      // Get the original order details
      const originalOrder = orders.find(o => o.id === selectedOrderForChat);
      if (!originalOrder) {
        console.error('Original order not found');
        return;
      }

      // Validate session
      if (!session) {
        alert('You must be logged in to submit a tip');
        return;
      }

      // Check if the original order is fully paid (completed)
      if (originalOrder.status !== 'completed') {
        alert('يجب أن يكون الطلب الأصلي مكتمل الدفع قبل إضافة البقشيش');
        return;
      }

      // Prepare payment data for tip
      const paymentData = {
        amount: parseFloat(tipAmount),
        currency: 'USD',
        game: originalOrder.game,
        service: `Tip for ${formatOrderId(originalOrder.id)}`,
        paymentMethod: 'coinbase',
        userId: session.user.id,
        userEmail: session.user.email
      };

      // Send payment request to Coinbase Commerce
      const paymentResponse = await fetch('/api/pay/coinbase/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const paymentResult = await paymentResponse.json();
      
      if (paymentResult.success && paymentResult.paymentUrl) {
        // Tip order will be created after successful payment confirmation
        // via /api/pay/confirm-payment or webhook
        console.log('Tip payment initiated:', tipAmount);
        setShowTipModal(false);
        setTipAmount(1);
        // Redirect to payment page
        window.location.href = paymentResult.paymentUrl;
      } else {
        throw new Error(paymentResult.error || 'Payment creation failed');
      }
    } catch (error) {
      console.error('Error submitting tip:', error);
      alert('Failed to process tip payment. Please try again or contact support.');
    }
  };

  const handleTipCancel = () => {
    setShowTipModal(false);
    setTipAmount(1);
  };



  // Show all orders without filtering
  const filteredOrders = orders;



  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="mb-4">{error}</p>
          <button 
            onClick={initializeOrders}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Orders - Gearscore</title>
        <meta name="description" content="View your service orders" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 text-white flex">
        {/* Removed filter sidebar */}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-8 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-gray-800/50 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">My Orders</h1>
                <p className="text-gray-400 mt-1">Track your service orders and chat with support</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Live Updates</span>
                </div>
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
                  <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">No Orders Yet</h2>
                <p className="text-gray-400 mb-8 text-lg leading-relaxed">You haven't made any purchases yet.<br/>Start by browsing our gaming services.</p>
                <button
                  onClick={() => router.push('/games')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-2xl hover:transform hover:scale-105"
                >
                  Browse Services
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Orders List */}
              <div className="w-1/5 border-r border-slate-700/50 overflow-y-auto bg-gradient-to-b from-slate-900/50 to-gray-900/50">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Your Orders</h3>
                </div>
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderForChat(order.id)}
                    className={`group mx-4 mb-4 p-4 rounded-xl cursor-pointer transition-all duration-300 hover:transform hover:scale-[1.02] ${
                      selectedOrderForChat === order.id 
                        ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/50 shadow-lg shadow-blue-500/20' 
                        : 'bg-gradient-to-r from-slate-800/50 to-gray-800/50 border border-slate-700/30 hover:border-slate-600/50 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                            selectedOrderForChat === order.id
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                              : 'bg-gradient-to-br from-slate-600 to-gray-600 group-hover:from-blue-500 group-hover:to-purple-600'
                          } transition-all duration-300`}>
                            {order.game === 'Path of Exile' ? <SparklesIcon className="h-4 w-4 text-white" /> : order.game === 'Rust' ? <FireIcon className="h-4 w-4 text-white" /> : <CubeIcon className="h-4 w-4 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-sm">{order.game}</h3>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const success = await copyWithFeedback(order.id, e.currentTarget);
                                  if (!success) {
                                    // Fallback: show alert with order ID
                                    alert(`Order ID: ${order.id}\n\nPlease copy this manually.`);
                                  }
                                }}
                                className="p-1 hover:bg-gray-600 rounded transition-colors"
                                title="Copy Order ID"
                              >
                                <svg className="w-3 h-3 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xs text-gray-400">{formatOrderId(order.id)}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-2 font-medium">{order.service}</p>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                order.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                order.status === 'pending' ? 'bg-blue-500/20 text-blue-400' :
                order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">{formatDate(order.date)}</p>
                          <span className="text-xs text-gray-400 font-medium">
                            {formatPrice(order.price)}
                          </span>
                        </div>
                      </div>
                      

                    </div>
                  </div>
                ))}
              </div>

              {/* Order Details & Chat */}
              <div className="flex-1 flex">
                {selectedOrderForChat ? (
                  <div className="flex-1 flex flex-col">
                    <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-gray-800/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Order Details</h2>
                          <p className="text-sm text-gray-400">Complete order information and support chat</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-4 rounded-xl border border-slate-700/30">
                          <p className="text-sm text-gray-400 mb-1">Order ID</p>
                          <p className="font-mono text-white font-semibold">{formatOrderId(selectedOrderForChat)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-4 rounded-xl border border-slate-700/30">
                          <p className="text-sm text-gray-400 mb-1">Date</p>
                          <p className="text-white font-semibold">{formatDate(orders.find(o => o.id === selectedOrderForChat)?.date)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-4 rounded-xl border border-slate-700/30">
                          <p className="text-sm text-gray-400 mb-1">Game</p>
                          <p className="text-white font-semibold">{orders.find(o => o.id === selectedOrderForChat)?.game}</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-4 rounded-xl border border-slate-700/30">
                          <p className="text-sm text-gray-400 mb-1">Service</p>
                          <p className="text-white font-semibold">{orders.find(o => o.id === selectedOrderForChat)?.service}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 rounded-xl border border-green-500/30">
                          <p className="text-sm text-green-400 mb-1">Price</p>
                          <p className="text-green-400 font-bold text-lg">{formatPrice(orders.find(o => o.id === selectedOrderForChat)?.price || 0)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-4 rounded-xl border border-slate-700/30">
                          <p className="text-sm text-gray-400 mb-1">Customer</p>
                          <p className="text-white font-semibold">{orders.find(o => o.id === selectedOrderForChat)?.customerName || 'N/A'}</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${
                          orders.find(o => o.id === selectedOrderForChat)?.status === 'completed' ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30' :
                          orders.find(o => o.id === selectedOrderForChat)?.status === 'in_progress' ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/30' :
                          orders.find(o => o.id === selectedOrderForChat)?.status === 'pending' ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30' :
                          orders.find(o => o.id === selectedOrderForChat)?.status === 'cancelled' ? 'bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/30' :
                          'bg-gradient-to-br from-slate-800/50 to-gray-800/50 border-slate-700/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm ${
                                orders.find(o => o.id === selectedOrderForChat)?.status === 'completed' ? 'text-green-400' :
                                orders.find(o => o.id === selectedOrderForChat)?.status === 'in_progress' ? 'text-yellow-400' :
                                orders.find(o => o.id === selectedOrderForChat)?.status === 'pending' ? 'text-blue-400' :
                                orders.find(o => o.id === selectedOrderForChat)?.status === 'cancelled' ? 'text-red-400' :
                                'text-gray-400'
                              }`}>Status</p>
                              <p className={`font-bold text-lg ${
                                orders.find(o => o.id === selectedOrderForChat)?.status === 'completed' ? 'text-green-400' :
                                orders.find(o => o.id === selectedOrderForChat)?.status === 'in_progress' ? 'text-yellow-400' :
                                orders.find(o => o.id === selectedOrderForChat)?.status === 'pending' ? 'text-blue-400' :
                                orders.find(o => o.id === selectedOrderForChat)?.status === 'cancelled' ? 'text-red-400' :
                                'text-gray-400'
                              }`}>{orders.find(o => o.id === selectedOrderForChat)?.status || 'Unknown'}</p>
                            </div>
                            {/* Tip Button - Positioned to the right of status */}
                            {session && orders && orders.length > 0 && selectedOrderForChat && 
                             orders.find(o => o.id === selectedOrderForChat)?.status === 'completed' && (
                              <button
                                onClick={() => setShowTipModal(true)}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 border border-green-400/30"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span>Add Tip</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-900/30 to-gray-900/30">
                      <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-gray-800/50">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <div>
                            <h2 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Chat with Support</h2>
                            <p className="text-xs text-gray-400">Get help with your order</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto" style={{marginRight: '60px'}}>
                        <ChatInterface orderId={selectedOrderForChat} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div>
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
                        <ClipboardListIcon className="h-12 w-12 text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">Select an Order</h3>
                      <p className="text-gray-400 text-lg leading-relaxed">Choose an order from the left to view<br/>details and chat with support.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Add Tip</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount: ${tipAmount}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={tipAmount}
                onChange={(e) => setTipAmount(parseInt(e.target.value))}
                className="tip-slider w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$1</span>
                <span>$100</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleTipSubmit}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={handleTipCancel}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Orders() {
  return (
    <OrdersProvider>
      <OrdersContent />
    </OrdersProvider>
  );
}