import React from 'react';
import { logClientError } from '../lib/clientErrorHandler';

// React Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, errorId: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to show error UI
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, errorId };
  }

  componentDidCatch(error, errorInfo) {
    // Log error with additional information
    const context = {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      errorId: this.state.errorId,
      props: this.props,
      timestamp: new Date().toISOString()
    };

    // Log error to server
    logClientError(error, context).catch(err => {
      console.error('Failed to log ErrorBoundary error:', err);
    });

    // Save error information in state
    this.setState({ error, errorInfo });

    // In development environment, print error to console
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 React Component Error:', error, errorInfo);
      console.error('🆔 Error ID:', this.state.errorId);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Error icon */}
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>

            {/* Error title */}
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Sorry, an error occurred!
            </h1>

            {/* Error message */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              An unexpected error occurred in this part of the website. The support team has been notified and the issue will be resolved soon.
            </p>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                إعادة المحاولة
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  الصفحة الرئيسية
                </button>
                
                <button
                  onClick={this.handleRefresh}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  إعادة تحميل الصفحة
                </button>
              </div>
            </div>

            {/* عرض معرف الخطأ فقط للمساعدة في التتبع */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">
                معرف الخطأ: <span className="font-mono">{this.state.errorId}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                يرجى تقديم هذا المعرف عند التواصل مع الدعم الفني
              </p>
            </div>
            
            {/* عرض تفاصيل الخطأ في بيئة التطوير فقط */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-3 bg-yellow-50 rounded-lg text-left">
                <summary className="cursor-pointer text-xs text-yellow-600 mb-2">
                  تفاصيل الخطأ (بيئة التطوير فقط)
                </summary>
                <div className="text-xs text-yellow-600 font-mono">
                  <p className="mb-2">
                    <strong>رسالة:</strong> {this.state.error.message}
                  </p>
                  <pre className="whitespace-pre-wrap text-xs bg-yellow-100 p-2 rounded">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook component for function errors
export function useErrorHandler() {
  const handleError = (error, context = {}) => {
    const errorContext = {
      ...context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server',
      timestamp: new Date().toISOString(),
      hookError: true
    };

    // Send error to server
    if (typeof window !== 'undefined') {
      logClientError(error, errorContext);
    }

    console.error('🚨 Hook Error:', error);
  };

  return { handleError };
}

// Component for displaying simple error messages
export function ErrorMessage({ message, type = 'error', onClose }) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-red-800';
    }
  };

  if (!message) return null;

  return (
    <div className={`p-4 rounded-lg border ${getBackgroundColor()} ${getTextColor()} mb-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {getIcon()}
          <span className="mr-2 font-medium">{message}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
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

export default ErrorBoundary;