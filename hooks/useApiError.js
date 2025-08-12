import { useState, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { useErrorHandler } from '../components/ErrorBoundary';
import { handleApiError as clientHandleApiError } from '../lib/clientErrorHandler';

/**
 * Custom hook for handling API call errors
 * Provides unified methods for handling errors and displaying appropriate messages
 */
export function useApiError() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showError, showSuccess } = useToast();
  const { handleError } = useErrorHandler();

  // Handle API errors
  const handleApiError = useCallback((error, context = {}) => {
    console.error('🚨 API Error:', error);
    
    // Log the error
    handleError(error, {
      ...context,
      apiError: true,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      url: typeof window !== 'undefined' ? window.location.href : null,
      userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null
    });

    // Use enhanced client error handler
    const errorResult = clientHandleApiError(error, {
      component: 'useApiError',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      url: typeof window !== 'undefined' ? window.location.href : null,
      userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null
    });
    
    // Handle special cases
    if (error.response?.status === 401 || errorResult?.errorType === 'authentication') {
      // Remove user data from local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
      }
      
      // Show appropriate message before redirect
      const authMessage = errorResult?.message || 'Your session has expired. Please log in again.';
      showError(authMessage);
      
      // Redirect to login page
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      
      setError(error);
      return errorResult;
    }

    // Show error message to user
    const userMessage = errorResult?.message || 'An unexpected error occurred';
    showError(userMessage);
    setError(error);
    
    // Return error information for use in components
    return errorResult;
  }, [handleError, showError]);

  // Execute API call with error handling
  const executeApiCall = useCallback(async (apiFunction, options = {}) => {
    const {
      showLoadingToast = false,
      showSuccessToast = false,
      successMessage = 'Success',
      loadingMessage = 'Processing...',
      context = {},
      onSuccess,
      onError
    } = options;

    try {
      setIsLoading(true);
      setError(null);
      
      if (showLoadingToast) {
        showSuccess(loadingMessage, 2000);
      }

      const result = await apiFunction();
      
      if (showSuccessToast) {
        showSuccess(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = handleApiError(error, context);
      
      if (onError) {
        onError(error, errorMessage);
      }
      
      throw error; // Re-throw error for additional handling if needed
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, showSuccess]);

  // Reset error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset all states
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    handleApiError,
    executeApiCall,
    clearError,
    reset
  };
}

/**
 * Hook for handling form errors
 */
export function useFormError() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const { showError } = useToast();

  // Handle form validation errors
  const handleValidationError = useCallback((error) => {
    if (error.response?.data?.errors) {
      // Specific field errors
      const errors = error.response.data.errors;
      const formattedErrors = {};
      
      Object.keys(errors).forEach(field => {
        formattedErrors[field] = errors[field][0]; // First error message
      });
      
      setFieldErrors(formattedErrors);
    } else {
      // General error
      const message = error.response?.data?.message || 'Data validation error';
      setGeneralError(message);
      showError(message);
    }
  }, [showError]);

  // Clear specific field error
  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    setGeneralError(null);
  }, []);

  // Get specific field error
  const getFieldError = useCallback((fieldName) => {
    return fieldErrors[fieldName];
  }, [fieldErrors]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName) => {
    return Boolean(fieldErrors[fieldName]);
  }, [fieldErrors]);

  return {
    fieldErrors,
    generalError,
    handleValidationError,
    clearFieldError,
    clearAllErrors,
    getFieldError,
    hasFieldError
  };
}

/**
 * Hook for handling file upload errors
 */
export function useFileUploadError() {
  const { showError, showSuccess } = useToast();
  const { handleError } = useErrorHandler();

  const handleFileUploadError = useCallback((error, fileName = '') => {
    let userMessage = 'File upload failed';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 413:
          userMessage = 'File size is too large';
          break;
        case 415:
          userMessage = 'File type not supported';
          break;
        case 422:
          userMessage = data?.message || 'Invalid file';
          break;
        default:
          userMessage = data?.message || 'File upload failed';
      }
    }
    
    if (fileName) {
      userMessage += `: ${fileName}`;
    }
    
    handleError(error, {
      component: 'FileUpload',
      fileName,
      fileUploadError: true
    });
    
    showError(userMessage);
    return userMessage;
  }, [handleError, showError]);

  const handleFileUploadSuccess = useCallback((fileName = '') => {
    const message = fileName ? `File uploaded successfully: ${fileName}` : 'File uploaded successfully';
    showSuccess(message);
  }, [showSuccess]);

  return {
    handleFileUploadError,
    handleFileUploadSuccess
  };
}

export default useApiError;