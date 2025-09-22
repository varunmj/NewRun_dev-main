import React, { useState, useEffect } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  style = {},
  width = 800,
  height = 800,
  quality = 85,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackIcon: FallbackIcon,
  showLoading = true,
  showError = true,
  ...props 
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [src]);

  const optimizeImageUrl = (url, targetWidth, targetHeight, targetQuality) => {
    if (!url) return url;
    
    // If it's already an optimized URL or external service, return as is
    if (url.includes('cloudinary') || url.includes('resize') || url.includes('transform') || url.includes('imagekit')) {
      return url;
    }
    
    // For local images or basic URLs, we'll use CSS to handle sizing
    // In production, you might want to use a service like Cloudinary, ImageKit, or Next.js Image
    return url;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    onError?.();
  };

  const retryLoad = () => {
    setImageLoading(true);
    setImageError(false);
  };

  const defaultStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    ...style
  };

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-white/5 ${className}`} style={defaultStyle}>
        {FallbackIcon ? (
          <FallbackIcon className="text-3xl text-white/40" />
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-white/60 text-sm">No image available</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={defaultStyle}>
      {/* Loading state */}
      {showLoading && imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <p className="text-white/60 text-sm">Loading...</p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {showError && imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-300 text-sm">Failed to load</p>
            <button 
              onClick={retryLoad}
              className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={optimizeImageUrl(src, width, height, quality)}
        alt={alt}
        className={`w-full h-full transition-all duration-300 ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={loading}
        style={defaultStyle}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
