import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ErrorPage() {
  const router = useRouter();
  const [errorInfo, setErrorInfo] = useState({
    message: 'An unexpected error occurred',
    statusCode: 500
  });
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Get error information from URL (without showing technical details)
    const { message, statusCode } = router.query;
    
    if (message || statusCode) {
      setErrorInfo({
        message: message ? decodeURIComponent(message) : 'An unexpected error occurred',
        statusCode: parseInt(statusCode) || 500
      });
    }

    // Countdown timer to return to home page
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const getErrorTitle = (statusCode) => {
    switch (statusCode) {
      case 404:
        return 'Page Not Found';
      case 403:
        return 'Access Forbidden';
      case 401:
        return 'Unauthorized Access';
      case 400:
        return 'Bad Request';
      case 500:
      default:
        return 'Sorry, an error occurred!';
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <Head>
        <title>Error - Gaming Website</title>
        <meta name="description" content="Error page" />
      </Head>

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
            {getErrorTitle(errorInfo.statusCode)}
          </h1>

          {/* Error message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {errorInfo.message}
          </p>

          {/* Countdown timer */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">
              You will be redirected to the home page in {countdown} seconds
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoHome}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Return to Home Page
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={handleGoBack}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Previous Page
              </button>
              
              <button
                onClick={handleRefresh}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>

          {/* Technical support link */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              If the problem persists, please contact:
            </p>
            <Link href="/contact" className="text-blue-500 hover:text-blue-600 font-medium">
              Technical Support
            </Link>
            
            {/* Additional information for developers in development environment only */}
            {process.env.NODE_ENV === 'development' && router.query.errorId && (
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-500 font-mono">
                Error ID: {router.query.errorId}
              </div>
            )}
          </div>

          {/* Helpful tips for user */}
          {errorInfo.statusCode === 404 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Helpful Tips:</h3>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Check the link validity</li>
                <li>• Search for content from the home page</li>
              </ul>
            </div>
          )}
          
          {errorInfo.statusCode >= 500 && (
            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
              <h3 className="text-sm font-semibold text-orange-800 mb-2">What can you do?</h3>
              <ul className="text-sm text-orange-600 space-y-1">
                <li>• Wait a moment then try again</li>
                <li>• Check your internet connection</li>
                <li>• If the error persists, contact technical support</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}