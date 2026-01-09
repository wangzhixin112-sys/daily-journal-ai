import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = <div className="bg-slate-100 animate-pulse rounded-full"></div>, 
  onLoad 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Check if Intersection Observer is supported
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observerRef.current?.unobserve(entry.target);
          }
        },
        {
          rootMargin: '200px 0px', // Preload when image is 200px from viewport
          threshold: 0.01
        }
      );

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }
    } else {
      // Fallback for browsers that don't support Intersection Observer
      setIsVisible(true);
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && placeholder}
      <img
        ref={imgRef}
        src={isVisible ? src : ''}
        alt={alt}
        onLoad={handleLoad}
        className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} absolute inset-0 w-full h-full object-cover`}
        loading="lazy" // Native lazy loading
      />
    </div>
  );
};
