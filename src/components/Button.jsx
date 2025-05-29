import React from 'react';
import { STYLES } from '../constants';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  className = '',
  onClick,
  ...props 
}) => {
  const baseClasses = variant === 'primary' ? STYLES.button.primary : STYLES.button.secondary;
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const loadingClasses = loading ? 'cursor-wait' : '';
  
  const combinedClasses = [
    baseClasses,
    sizeClasses[size] || sizeClasses.medium,
    disabledClasses,
    loadingClasses,
    'flex items-center justify-center font-medium',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button 
      className={combinedClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
        >
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
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;