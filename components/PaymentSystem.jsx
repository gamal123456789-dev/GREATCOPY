import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useOrders } from '../context/OrdersContext';
import { useApiError } from '../hooks/useApiError';
import { useLanguageSystem } from '../hooks/useLanguageSystem';
import { v4 as uuidv4 } from 'uuid';

/**
 * Unified and Flexible Payment System - Language System
 * Built on professional War Thunder system architecture
 */
const PaymentSystem = ({
  game,
  service,
  price,
  onPaymentStart,
  onPaymentComplete,
  onPaymentError,
  customPaymentMethods = [],
  showContactSupport = true,
  className = ""
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cryptomus');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addOrder } = useOrders();
  const { handleApiError } = useApiError();
  const { getText, getDirection } = useLanguageSystem();
  
  // Prevent hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Use default English text during SSR to prevent hydration mismatch
  const getTextSafe = (category, key) => {
    if (!isClient) {
      // Default English fallbacks for SSR
      const fallbacks = {
        common: {
          paymentMethod: 'Payment Method',
          otherPaymentMethods: 'Other Payment Methods',
          contactSupportForAlternatives: 'Contact support for alternatives',
          processing: 'Processing...',
          contactSupport: 'Contact Support',
          purchaseService: 'Purchase Service'
        },
        payment: {
          ensureServiceAndPrice: 'Please ensure service and price are selected correctly.',
          contactSupportMessage: 'Please contact our support team for alternative payment methods.',
          invalidPaymentMethod: 'Invalid payment method',
          loginRequired: 'Login required',
          paymentProcessingFailed: 'Payment processing failed',
          sessionExpiredDuringOrder: 'User session expired during order creation. Please log in again.',
          sessionCheckError: 'Error checking user session. Please try again.',
          failedToCreateOrder: 'Failed to create order record after successful payment. Please contact technical support.'
        }
      };
      return fallbacks[category]?.[key] || key;
    }
    return getText(category, key);
  };

  // Default payment methods - War Thunder Method
  const defaultPaymentMethods = [
    {
      id: 'cryptomus',
      name: 'Cryptomus',
      badge: 'Fast',
      badgeColor: 'bg-blue-500',
      icon: '🔐',
      endpoint: '/api/pay/cryptomus/create-payment'
    },
    {
      id: 'other',
      name: 'Other Payment Method',
      badge: 'Contact',
      badgeColor: 'bg-purple-500',
      icon: '💬',
      endpoint: null,
      isContactMethod: true
    }
  ];

  // Merge custom payment methods with defaults
  const availablePaymentMethods = [...defaultPaymentMethods, ...customPaymentMethods];

  const handlePurchase = async () => {
    if (status === "loading" || isProcessingPayment) return;
    
    if (!session) {
      alert('You must be logged in to complete the payment');
      router.push("/auth");
      return;
    }

    // Validate input data
    if (!game || !service || !price || parseFloat(price) <= 0) {
      alert(getTextSafe('payment', 'ensureServiceAndPrice'));
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      // Call callback before payment starts
      if (onPaymentStart) {
        onPaymentStart({
          game,
          service,
          price,
          paymentMethod: selectedPaymentMethod
        });
      }

      // Handle contact support option
      if (selectedPaymentMethod === 'contact') {
        alert(getTextSafe('payment', 'contactSupportMessage'));
        return;
      }

      // Find selected payment method
      const paymentMethod = availablePaymentMethods.find(method => method.id === selectedPaymentMethod);
      if (!paymentMethod) {
        throw new Error(getTextSafe('payment', 'invalidPaymentMethod'));
      }

      // Setup payment data
      const paymentData = {
        amount: parseFloat(price),
        currency: 'USD',
        game,
        service,
        paymentMethod: selectedPaymentMethod,
        userId: session.user.id,
        userEmail: session.user.email
      };

      // Send payment request
      const paymentResponse = await fetch(paymentMethod.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json().catch(() => ({}));
        if (paymentResponse.status === 401) {
          const error = new Error(getTextSafe('payment', 'loginRequired'));
          error.status = 401;
          throw error;
        }
        const errorMessage = (errorData && errorData.message) ? String(errorData.message) : getTextSafe('payment', 'paymentProcessingFailed');
        const error = new Error(errorMessage);
        error.status = paymentResponse.status;
        error.errorData = errorData;
        throw error;
      }

      const paymentResult = await paymentResponse.json();
      console.log('Payment processed:', paymentResult);

      // Check for payment URL to redirect to
      if (paymentResult.paymentUrl || paymentResult.payment_url) {
        console.log('Redirecting to payment page - order will be created after successful payment');
        // Redirect to payment page directly - order will be created after payment confirmation
        window.location.href = paymentResult.paymentUrl || paymentResult.payment_url;
        return;
      }

      // For successful payments without redirect
      if (paymentResult.success) {
        // Basic session validation - let the server handle detailed authentication
        console.log('🔐 Session validation before order creation:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasUserId: !!session?.user?.id,
          sessionStatus: status
        });

        // Only check for basic session existence - server will handle authentication
        if (!session || !session.user || !session.user.id) {
          console.error('❌ No session found - redirecting to auth');
          alert(getText('payment', 'sessionExpiredDuringOrder') || 'جلسة المستخدم انتهت أثناء إنشاء الطلب. يرجى تسجيل الدخول مرة أخرى.');
          router.push('/auth');
          return;
        }

        // Continue with order creation - let server handle session validation

        const order = {
          id: paymentResult.charge_id || paymentResult.transactionId || uuidv4(),
          customerName: session.user.username || session.user.name || session.user.email.split("@")[0],
          game,
          service,
          status: 'pending',
          price: parseFloat(price),
          date: new Date().toISOString(),
        };

        console.log('📝 Creating order with data:', order);
        const orderCreated = await addOrder(order);
        if (orderCreated) {
          console.log('Order created successfully for direct payment');
          if (onPaymentComplete) {
            onPaymentComplete({
              order,
              paymentResult
            });
          }
          router.push('/orders');
        } else {
          console.error('❌ Failed to create order - addOrder returned false');
          console.error('📊 Order creation failure details:', {
            orderData: order,
            sessionValid: !!session?.user?.id,
            timestamp: new Date().toISOString()
          });
          
          // Show specific error message
          const errorMessage = getTextSafe('payment', 'failedToCreateOrder') || 'Failed to create order record after successful payment. Please contact technical support.';
          alert(errorMessage);
          
          throw new Error('Failed to create order record after successful payment');
        }
      }

    } catch (error) {
      console.error("Error during purchase:", error);
      
      // Call error callback
      if (onPaymentError) {
        onPaymentError(error);
      }
      
      // Enhanced error handling
      handleApiError(error, {
        action: 'payment_processing',
        game,
        service,
        amount: price,
        paymentMethod: selectedPaymentMethod
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Show login required message if user is not authenticated
  if (!session && status !== "loading") {
    return (
      <div className={`payment-system ${className}`} dir={getDirection()}>
        <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-yellow-400 font-semibold">يجب تسجيل الدخول</h3>
              <p className="text-yellow-300 text-sm mt-1">يجب عليك تسجيل الدخول أولاً لإتمام عملية الدفع</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/auth')}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`payment-system ${className}`} dir={getDirection()}>
      {/* Payment Method Selection */}
      <div className="mb-6">
        <p className="text-gray-400 font-semibold mb-3">{getTextSafe('common', 'paymentMethod')}</p>
        <div className="space-y-2">
          {availablePaymentMethods.map((method) => (
            <label key={method.id} className="flex items-center p-3 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selectedPaymentMethod === method.id}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="mr-3 text-blue-500"
              />
              <div className="flex items-center">
                {method.icon && <span className="mr-2 text-lg">{method.icon}</span>}
                <span className="text-white font-medium">{method.name}</span>
                {method.badge && (
                  <span className={`ml-2 text-xs text-white px-2 py-1 rounded ${method.badgeColor}`}>
                    {method.badge}
                  </span>
                )}
              </div>
            </label>
          ))}
          
          {/* Contact Support Option */}
          {showContactSupport && (
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
                <span className="text-white font-medium">{getTextSafe('common', 'otherPaymentMethods')}</span>
                <p className="text-xs text-gray-400 mt-1">{getTextSafe('common', 'contactSupportForAlternatives')}</p>
              </div>
            </label>
          )}
        </div>
      </div>
      
      {/* Purchase Button */}
      <button 
        onClick={handlePurchase} 
        disabled={isProcessingPayment || parseFloat(price) <= 0}
        className={`w-full py-4 px-6 rounded-lg font-bold text-lg text-white transition-all duration-300 shadow-lg transform hover:-translate-y-1 purchase-button ${
          isProcessingPayment || parseFloat(price) <= 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isProcessingPayment 
          ? getTextSafe('common', 'processing') 
          : selectedPaymentMethod === 'contact' 
            ? getTextSafe('common', 'contactSupport') 
            : getTextSafe('common', 'purchaseService')
        }
      </button>
    </div>
  );
};

export default PaymentSystem;