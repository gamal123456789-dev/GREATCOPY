// Client-side error handler
// This file is designed for browser use only

// Function to log errors on client side
export async function logClientError(error, context = {}) {
  try {
    const errorData = {
      error: {
        message: error.message || 'Unknown error',
        name: error.name || 'Error',
        stack: error.stack || 'No stack trace available'
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        source: 'client',
        ...context
      }
    };

    // Send error to server
    await fetch('/api/log-client-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorData)
    });
  } catch (err) {
    // In case of logging failure, log to console
    console.error('Failed to log error:', err);
    console.error('Original error:', error);
  }
}

// User-friendly error messages
const CLIENT_ERROR_MESSAGES = {
  network: 'Internet connection problem. Please check your connection and try again.',
  timeout: 'Request timeout. Please try again.',
  authentication: 'Your session has expired. Please log in again.',
  authorization: 'You do not have permission to access this content.',
  validation: 'The entered data is incorrect. Please check the information.',
  not_found: 'The requested content was not found.',
  server: 'A server error occurred. Please try again later.',
  file: 'Problem uploading file. Please check file type and size.',
  database: 'Database problem. Please try again.',
  connection: 'Problem connecting to server. Please try again.',
  method: 'Request method not supported.',
  default: 'An unexpected error occurred. Please try again.'
};

// Determine error type on client side
function getClientErrorType(error) {
  if (!error) return 'default';
  
  const message = error.message?.toLowerCase() || '';
  const status = error.status || error.response?.status;
  
  // Network errors
  if (error.name === 'NetworkError' || message.includes('network') || 
      message.includes('fetch') || message.includes('connection')) {
    return 'network';
  }
  
  // Timeout errors
  if (error.name === 'TimeoutError' || message.includes('timeout')) {
    return 'timeout';
  }
  
  // Errors by status code
  switch (status) {
    case 401:
      return 'authentication';
    case 403:
      return 'authorization';
    case 404:
      return 'not_found';
    case 405:
      return 'method';
    case 422:
    case 400:
      return 'validation';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'server';
    default:
      break;
  }
  
  // Errors by content
  if (message.includes('validation') || message.includes('invalid')) {
    return 'validation';
  }
  if (message.includes('unauthorized') || message.includes('authentication')) {
    return 'authentication';
  }
  if (message.includes('forbidden') || message.includes('authorization')) {
    return 'authorization';
  }
  if (message.includes('not found')) {
    return 'not_found';
  }
  if (message.includes('file') || message.includes('upload')) {
    return 'file';
  }
  if (message.includes('database') || message.includes('sql')) {
    return 'database';
  }
  
  return 'default';
}

// Get appropriate error message
function getClientErrorMessage(errorType) {
  return CLIENT_ERROR_MESSAGES[errorType] || CLIENT_ERROR_MESSAGES.default;
}

// General client error handling function
export function handleClientError(error, context = {}) {
  // Create unique error ID
  const errorId = `CLIENT_ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add error ID to context
  const enhancedContext = {
    ...context,
    errorId,
    clientSide: true
  };
  
  // Log the error
  logClientError(error, enhancedContext);

  // In development environment, show error details
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Client error:', error);
    console.error('🆔 Error ID:', errorId);
    console.error('Context:', context);
  }

  // Determine error type and appropriate message
  const errorType = getClientErrorType(error);
  const userMessage = getClientErrorMessage(errorType);

  // Return appropriate message for user
  return {
    message: userMessage,
    type: 'error',
    errorId,
    errorType
  };
}

// Function to setup general error handling
export function setupGlobalErrorHandling() {
  // Handle unhandled errors
  window.addEventListener('error', (event) => {
    handleClientError(event.error || new Error(event.message), {
      type: 'unhandled_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Handle unhandled Promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    handleClientError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        type: 'unhandled_promise_rejection'
      }
    );

    // Prevent showing error in console in production
    if (process.env.NODE_ENV === 'production') {
      event.preventDefault();
    }
  });
}

// Helper function for handling API errors
export function handleApiError(error, context = {}) {
  const errorResult = handleClientError(error, {
    ...context,
    type: 'api_error',
    apiError: true
  });
  
  // If Toast system exists, use it to show error with error ID
  if (typeof window !== 'undefined' && window.showToast) {
    window.showToast(errorResult.message, 'error', 5000, errorResult.errorId);
  }
  
  return errorResult;
}

export default {
  logClientError,
  handleClientError,
  setupGlobalErrorHandling,
  handleApiError
};