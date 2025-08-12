import React, { useState, useEffect } from 'react';
import { useErrorHandler } from './ErrorBoundary';
import { useToast } from './Toast';

// مكون التحميل مع معالجة الأخطاء
export function LoadingWithError({ 
  isLoading, 
  error, 
  children, 
  loadingText = 'جاري التحميل...', 
  errorText = 'حدث خطأ أثناء التحميل',
  retryText = 'إعادة المحاولة',
  onRetry,
  showErrorToast = true,
  customLoadingComponent,
  customErrorComponent
}) {
  const { handleError } = useErrorHandler();
  const { showError } = useToast();
  const [hasShownError, setHasShownError] = useState(false);

  // عرض Toast للخطأ
  useEffect(() => {
    if (error && showErrorToast && !hasShownError) {
      showError(errorText);
      handleError(error, { component: 'LoadingWithError' });
      setHasShownError(true);
    }
    if (!error) {
      setHasShownError(false);
    }
  }, [error, showErrorToast, errorText, hasShownError, handleError, showError]);

  // عرض حالة التحميل
  if (isLoading) {
    if (customLoadingComponent) {
      return customLoadingComponent;
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 font-medium">{loadingText}</p>
      </div>
    );
  }

  // عرض حالة الخطأ
  if (error) {
    if (customErrorComponent) {
      return customErrorComponent;
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{errorText}</h3>
        <p className="text-gray-600 mb-4">يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {retryText}
          </button>
        )}
      </div>
    );
  }

  // عرض المحتوى العادي
  return children;
}

// مكون دوار التحميل
export function LoadingSpinner({ size = 'medium', color = 'blue' }) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4';
      case 'large':
        return 'w-12 h-12';
      case 'xl':
        return 'w-16 h-16';
      default:
        return 'w-8 h-8';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'red':
        return 'text-red-500';
      case 'green':
        return 'text-green-500';
      case 'yellow':
        return 'text-yellow-500';
      case 'purple':
        return 'text-purple-500';
      case 'gray':
        return 'text-gray-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className={`animate-spin ${getSizeClasses()} ${getColorClasses()}`}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

// مكون تحميل الصفحة الكاملة
export function FullPageLoading({ message = 'جاري تحميل الصفحة...' }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}

// مكون تحميل الأزرار
export function ButtonLoading({ 
  isLoading, 
  children, 
  loadingText = 'جاري المعالجة...', 
  disabled = false,
  className = '',
  ...props 
}) {
  return (
    <button
      disabled={isLoading || disabled}
      className={`relative ${className} ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
      {...props}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="small" color="white" />
        </div>
      )}
      <span className={isLoading ? 'invisible' : 'visible'}>
        {isLoading ? loadingText : children}
      </span>
    </button>
  );
}

// مكون تحميل البيانات مع إعادة المحاولة
export function DataLoader({ 
  fetchData, 
  dependencies = [], 
  children, 
  loadingComponent,
  errorComponent,
  retryDelay = 1000,
  maxRetries = 3
}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const { handleError } = useErrorHandler();

  const loadData = async (isRetry = false) => {
    try {
      if (!isRetry) {
        setIsLoading(true);
      }
      setError(null);
      
      const result = await fetchData();
      setData(result);
      setRetryCount(0);
    } catch (err) {
      console.error('خطأ في تحميل البيانات:', err);
      handleError(err, { component: 'DataLoader', retryCount });
      setError(err);
      
      // إعادة المحاولة التلقائية
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadData(true);
        }, retryDelay * (retryCount + 1)); // زيادة التأخير مع كل محاولة
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, dependencies);

  const handleRetry = () => {
    setRetryCount(0);
    loadData();
  };

  return (
    <LoadingWithError
      isLoading={isLoading}
      error={error}
      onRetry={handleRetry}
      customLoadingComponent={loadingComponent}
      customErrorComponent={errorComponent}
    >
      {children(data)}
    </LoadingWithError>
  );
}

// مكون تحميل الصور مع معالجة الأخطاء
export function ImageWithLoading({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '/images/placeholder.png',
  loadingClassName = 'bg-gray-200 animate-pulse',
  ...props 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const { handleError } = useErrorHandler();

  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = (err) => {
    setIsLoading(false);
    setError(true);
    
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      handleError(new Error(`فشل في تحميل الصورة: ${src}`), {
        component: 'ImageWithLoading',
        originalSrc: src,
        fallbackSrc
      });
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setCurrentSrc(src);
  }, [src]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className={`absolute inset-0 ${loadingClassName} flex items-center justify-center`}>
          <LoadingSpinner size="small" color="gray" />
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        {...props}
      />
    </div>
  );
}

export default LoadingWithError;