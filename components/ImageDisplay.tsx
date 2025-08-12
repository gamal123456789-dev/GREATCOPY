import React, { useState, useCallback } from 'react';
import Image from 'next/image';

interface ImageDisplayProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  showHoverOverlay?: boolean;
  orderId?: string;
  onOrderInteraction?: (orderId: string, imageUrl: string) => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  src,
  alt = 'Uploaded Image',
  className = '',
  onClick,
  showHoverOverlay = true,
  orderId,
  onOrderInteraction
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const handleImageError = useCallback(() => {
    console.error('❌ Image failed to load:', src, 'Retry count:', retryCount);
    
    if (retryCount < maxRetries) {
      // Auto retry after a short delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageError(false);
        setIsLoading(true);
      }, 1000 * (retryCount + 1)); // Exponential backoff
    } else {
      setImageError(true);
      setIsLoading(false);
    }
  }, [src, retryCount, maxRetries]);

  const handleImageLoad = useCallback(() => {
    console.log('✅ Image loaded successfully:', src);
    setImageError(false);
    setIsLoading(false);
  }, [src]);

  // Reset states when src changes
  React.useEffect(() => {
    setImageError(false);
    setIsLoading(true);
    setRetryCount(0);
  }, [src]);

  // Add cache busting only when retrying for better performance
  const getImageSrc = useCallback(() => {
    // Only add cache busting on retry to improve performance
    if (retryCount > 0) {
      const separator = src.includes('?') ? '&' : '?';
      const timestamp = Date.now();
      return `${src}${separator}retry=${retryCount}&t=${timestamp}`;
    }
    return src;
  }, [src, retryCount]);

  if (imageError) {
    return (
      <div className={`bg-red-100 border border-red-300 rounded-lg p-4 text-center ${className}`}>
        <div className="text-red-600 text-sm">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Image failed to load</p>
          <p className="text-xs mt-1 opacity-75">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 rounded-lg flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-gray-300 text-xs">Loading...</span>
          </div>
        </div>
      )}
      
      {/* Using regular img for better compatibility */}
      <img
        src={getImageSrc()}
        alt={alt}
        className={`w-full h-auto rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        onClick={() => {
          if (onClick) onClick();
          if (orderId && onOrderInteraction) {
            onOrderInteraction(orderId, src);
          }
        }}
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          objectFit: 'contain',
          imageRendering: 'auto'
        }}
        loading="lazy"
        decoding="async"
      />
      
      {/* Click indicator for full view */}
      {onClick && showHoverOverlay && !isLoading && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          🔍 Click to view
        </div>
      )}

    </div>
  );
};

export default ImageDisplay;