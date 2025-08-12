import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useOrders } from '../context/OrdersContext';
import { useLanguageSystem } from '../hooks/useLanguageSystem';
import { v4 as uuidv4 } from 'uuid';

/**
 * Unified Order Summary Component
 * Displays game name, service, price and handles Coinbase payment only
 * Replaces the old order summary system across all game pages
 */
const UnifiedOrderSummary = ({
  gameName,
  serviceName,
  serviceDetails,
  price,
  onPaymentStart,
  onPaymentComplete,
  onPaymentError,
  className = "price-summary-card sticky top-8"
}) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cryptomus');
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addOrder } = useOrders();
  const { getText, getDirection } = useLanguageSystem();

  const handlePurchaseService = async () => {
    if (isProcessingPayment) return;

    // Check if user is logged in, redirect to auth if not
    if (!session) {
      router.push('/auth');
      return;
    }

    // Handle "Other Payment Method" option
    if (selectedPaymentMethod === 'other') {
      // Open Discord link directly
      window.open('https://discord.gg/ecnayG8yND', '_blank');
      return;
    }

    // Validate input data
    if (!gameName || !serviceName || !price || parseFloat(price) <= 0) {
      alert('Please ensure service and price are selected correctly');
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      // Call callback before payment starts
      if (onPaymentStart) {
        onPaymentStart({
          game: gameName,
          service: serviceName,
          price,
          paymentMethod: selectedPaymentMethod
        });
      }

      // Setup payment data
      const paymentData = {
        amount: parseFloat(price),
        currency: 'USD',
        game: gameName,
        service: serviceName,
        serviceDetails,
        paymentMethod: selectedPaymentMethod,
        userId: session?.user?.id || 'guest',
        userEmail: session?.user?.email || 'guest@example.com'
      };

      // Use Cryptomus API endpoint
      const apiEndpoint = '/api/pay/cryptomus/create-payment';

      // Send payment request
      const paymentResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!paymentResponse.ok) {
        let errorData = {};
        try {
          errorData = await paymentResponse.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        console.error('Payment API Error:', {
          status: paymentResponse.status,
          statusText: paymentResponse.statusText,
          errorData
        });
        
        if (paymentResponse.status === 401) {
          alert('انتهت صلاحية الجلسة. يرجى المحاولة مرة أخرى.');
          return;
        }
        
        // Provide more specific error messages
        let errorMessage = 'فشل في معالجة الدفع';
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData && errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData && errorData.details) {
          errorMessage = errorData.details;
        } else if (paymentResponse.status === 500) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
        } else if (paymentResponse.status === 400) {
          errorMessage = 'بيانات الطلب غير صحيحة. يرجى التحقق من البيانات.';
        }
        
        throw new Error(errorMessage);
      }

      const paymentResult = await paymentResponse.json();
      console.log('Payment processed:', paymentResult);

      // Check for payment URL to redirect to Coinbase
      if (paymentResult.paymentUrl || paymentResult.payment_url) {
        console.log('Redirecting to payment page - order will be created after successful payment');
        // Save current page URL for return navigation
        localStorage.setItem('returnUrl', window.location.href);
        // Redirect to Coinbase payment page directly - order will be created after payment confirmation
        window.location.href = paymentResult.paymentUrl || paymentResult.payment_url;
        return;
      }

      // Handle successful payment callback
      if (onPaymentComplete) {
        onPaymentComplete(paymentResult);
      }

    } catch (error) {
      console.error('Payment error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'حدث خطأ أثناء معالجة الدفع';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show error to user
      alert(errorMessage);
      
      // Call error callback if provided
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Show loading state
  if (status === "loading") {
    return (
      <div className={className} dir={getDirection()}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-600 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  // Remove login requirement - allow guest users to see order summary

  return (
    <div className={className} dir={getDirection()}>
      <h3 className="text-2xl font-bold text-white mb-6">Order Summary</h3>
      
      {/* Service Details */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Game:</span>
          <span className="font-semibold text-white">{gameName}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Service:</span>
          <span className="font-semibold text-white">
            {serviceName || 'Not Selected'}
          </span>
        </div>
        
        {serviceDetails && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Details:</span>
            <span className="font-semibold text-white text-right">
              {serviceDetails}
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center border-t border-gray-600 pt-4">
          <span className="text-gray-400">Total Price:</span>
          <span className="text-3xl font-bold text-blue-400">${price}</span>
        </div>
      </div>
      
      {/* Payment Method Selection */}
      <div className="mb-6">
        <p className="text-gray-400 font-semibold mb-3">Payment Method</p>
        

        
        {/* Cryptomus Option */}
        <div 
          className={`flex items-center p-3 rounded-lg border cursor-pointer mb-2 transition-all ${
            selectedPaymentMethod === 'cryptomus' 
              ? 'border-purple-500 bg-purple-900/30' 
              : 'border-gray-600 bg-gray-700 hover:border-gray-500'
          }`}
          onClick={() => setSelectedPaymentMethod('cryptomus')}
        >
          <input 
            type="radio" 
            name="paymentMethod" 
            value="cryptomus" 
            checked={selectedPaymentMethod === 'cryptomus'}
            onChange={() => setSelectedPaymentMethod('cryptomus')}
            className="mr-3"
          />
          <div className="flex items-center">
            <span className="mr-2 text-lg">🔐</span>
            <span className="text-white font-medium">Cryptomus</span>
            <span className="ml-2 text-xs text-white px-2 py-1 rounded bg-purple-600">
              Crypto
            </span>
          </div>
        </div>
        
        {/* Other Payment Method Option */}
        <div 
          className={`flex items-center p-3 rounded-lg border cursor-pointer mb-2 transition-all ${
            selectedPaymentMethod === 'other' 
              ? 'border-green-500 bg-green-900/30' 
              : 'border-gray-600 bg-gray-700 hover:border-gray-500'
          }`}
          onClick={() => setSelectedPaymentMethod('other')}
        >
          <input 
            type="radio" 
            name="paymentMethod" 
            value="other" 
            checked={selectedPaymentMethod === 'other'}
            onChange={() => setSelectedPaymentMethod('other')}
            className="mr-3"
          />
          <div className="flex items-center">
            <span className="mr-2 text-lg">💬</span>
            <span className="text-white font-medium">Other Payment Method</span>
            <span className="ml-2 text-xs text-white px-2 py-1 rounded bg-green-600">
              Discord
            </span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
           {selectedPaymentMethod === 'cryptomus' 
             ? 'Secure payment via Cryptomus'
             : 'Please contact us on Discord for alternative payment methods'
           }
         </p>
      </div>
      
      {/* Purchase Button */}
      <button 
        onClick={handlePurchaseService} 
        disabled={isProcessingPayment || parseFloat(price) <= 0}
        className={`w-full py-4 px-6 rounded-lg font-bold text-lg text-white transition-all duration-300 shadow-lg transform hover:-translate-y-1 ${
          isProcessingPayment || parseFloat(price) <= 0 
            ? 'opacity-50 cursor-not-allowed bg-gray-600' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
        }`}
      >
        {isProcessingPayment 
          ? 'Processing...' 
          : selectedPaymentMethod === 'other'
          ? `Contact us - $${price}`
          : 'Purchase Service'
        }
      </button>
      
      {/* Security Notice */}
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center mt-1">
          <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-gray-500">SSL Secured</span>
        </div>
      </div>
    </div>
  );
};

export default UnifiedOrderSummary;