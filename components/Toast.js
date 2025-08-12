import React, { useState, useEffect, createContext, useContext } from 'react';

// Toast context
const ToastContext = createContext();

// Hook for using Toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Add new toast
  const addToast = (message, type = 'info', duration = 5000, errorId = null) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration,
      createdAt: Date.now(),
      errorId // Add error ID if available
    };

    setToasts(prev => [...prev, toast]);

    // Remove Toast automatically after specified duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  // Remove toast
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Remove all toasts
  const clearToasts = () => {
    setToasts([]);
  };

  // Helper functions for different types of toasts
  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  // Expose global showToast function for clientErrorHandler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showToast = (message, type = 'info', duration = 5000, errorId = null) => {
        return addToast(message, type, duration, errorId);
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.showToast;
      }
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast container
function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Single Toast item
function ToastItem({ toast, onRemove }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Show Toast with slide effect
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(onRemove, 300); // Wait for animation to finish
  };

  const getToastStyles = () => {
    const baseStyles = 'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out';
    
    if (isRemoving) {
      return `${baseStyles} translate-x-full opacity-0`;
    }
    
    if (isVisible) {
      return `${baseStyles} translate-x-0 opacity-100`;
    }
    
    return `${baseStyles} translate-x-full opacity-0`;
  };

  const getIconAndColor = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: (
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-green-50',
          borderColor: 'border-l-green-400'
        };
      case 'error':
        return {
          icon: (
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          borderColor: 'border-l-red-400'
        };
      case 'warning':
        return {
          icon: (
            <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: 'bg-yellow-50',
          borderColor: 'border-l-yellow-400'
        };
      default:
        return {
          icon: (
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-blue-50',
          borderColor: 'border-l-blue-400'
        };
    }
  };

  const { icon, bgColor, borderColor } = getIconAndColor();

  return (
    <div className={getToastStyles()}>
      <div className={`p-4 border-l-4 ${borderColor} ${bgColor}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="mr-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {toast.message}
            </p>
            {/* عرض معرف الخطأ في بيئة التطوير فقط */}
            {process.env.NODE_ENV === 'development' && toast.errorId && (
              <div className="toast-error-id">
                <small>معرف الخطأ: {toast.errorId}</small>
                <style jsx>{`
                  .toast-error-id {
                    margin-top: 4px;
                    opacity: 0.7;
                    font-family: monospace;
                    font-size: 11px;
                    color: #666;
                    background-color: rgba(0, 0, 0, 0.05);
                    padding: 2px 6px;
                    border-radius: 3px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                  }
                `}</style>
              </div>
            )}
          </div>
          <div className="mr-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleRemove}
            >
              <span className="sr-only">إغلاق</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Toast component for direct use
export function SimpleToast({ message, type = 'info', onClose, autoClose = true, duration = 5000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!isVisible) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300'
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300'
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300'
        };
      default:
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300'
        };
    }
  };

  const { icon, bgColor, textColor, borderColor } = getIconAndColor();

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${bgColor} ${textColor} border ${borderColor} rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-lg ml-2">{icon}</span>
          <span className="font-medium">{message}</span>
        </div>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default ToastProvider;