import React, { useState, useEffect } from 'react';
import PaymentSystem from './PaymentSystem';
import { useLanguageSystem } from '../hooks/useLanguageSystem';

/**
 * Unified Price Display Component
 * Works with centralized payment system - Language System
 */
const PriceDisplay = ({
  game,
  service,
  serviceName,
  serviceDetails,
  price,
  customPaymentMethods = [],
  showContactSupport = true,
  onPaymentStart,
  onPaymentComplete,
  onPaymentError,
  className = "price-summary-card sticky top-8"
}) => {
  const { getText, getDirection } = useLanguageSystem();
  const [isClient, setIsClient] = useState(false);
  
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
          orderSummary: 'Order Summary',
          game: 'Game',
          service: 'Service',
          details: 'Details',
          totalPrice: 'Total Price',
          notSelected: 'Not Selected'
        }
      };
      return fallbacks[category]?.[key] || key;
    }
    return getText(category, key);
  };
  
  const getDirectionSafe = () => {
    if (!isClient) {
      return 'ltr'; // Default to LTR during SSR
    }
    return getDirection();
  };
  
  return (
    <div className={className} dir={getDirectionSafe()}>
      <h3 className="text-2xl font-bold text-white mb-6">{getTextSafe('common', 'orderSummary')}</h3>
      
      {/* Service Details */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">{getTextSafe('common', 'game')}:</span>
          <span className="font-semibold text-white">{game}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">{getTextSafe('common', 'service')}:</span>
          <span className="font-semibold text-white">
            {serviceName || service || getTextSafe('common', 'notSelected')}
          </span>
        </div>
        
        {serviceDetails && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">{getTextSafe('common', 'details')}:</span>
            <span className="font-semibold text-white text-right">
              {serviceDetails}
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center border-t border-gray-600 pt-4">
          <span className="text-gray-400">{getTextSafe('common', 'totalPrice')}:</span>
          <span className="text-3xl font-bold price-text">${price}</span>
        </div>
      </div>
      
      {/* نظام الدفع */}
      <PaymentSystem
        game={game}
        service={service}
        price={price}
        customPaymentMethods={customPaymentMethods}
        showContactSupport={showContactSupport}
        onPaymentStart={onPaymentStart}
        onPaymentComplete={onPaymentComplete}
        onPaymentError={onPaymentError}
      />
    </div>
  );
};

export default PriceDisplay;