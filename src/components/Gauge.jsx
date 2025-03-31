import React, { useMemo } from 'react';
import { getGaugeColor, getUtilizationColor } from '../utils';

const Gauge = ({ percentage, label, size = 'md' }) => {
  const validPercentage = Math.min(100, Math.max(0, percentage || 0));
  
  // Size dimensions
  const dimensions = useMemo(() => {
    switch(size) {
      case 'sm': return { wrapper: 'w-22 h-22', text: 'text-sm', labelText: 'text-xs', radius: 45 };
      case 'lg': return { wrapper: 'w-40 h-40', text: 'text-2xl', labelText: 'text-sm', radius: 45 };
      default: return { wrapper: 'w-25 h-25 sm:w-24 sm:h-24', text: 'text-lg', labelText: 'text-xs', radius: 45 };
    }
  }, [size]);
  
  const radius = dimensions.radius;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (validPercentage / 100) * circumference;
  const color = getGaugeColor(validPercentage);
  const textColor = getUtilizationColor(validPercentage);
  
  return (
    <div className={`relative ${dimensions.wrapper} flex items-center justify-center`}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Background circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="none" 
          stroke="#e5e7eb" 
          strokeWidth="8"
          className="dark:stroke-gray-700" 
        />
        {/* Foreground circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="none" 
          stroke={color} 
          strokeWidth="8" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round" 
          transform="rotate(-90 50 50)" 
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`font-bold ${dimensions.text} ${textColor}`}>
          {validPercentage.toFixed(1)}%
        </span>
        <span className={`${dimensions.labelText} text-gray-500 dark:text-gray-400 mt-1`}>
          {label}
        </span>
      </div>
    </div>
  );
};

export default Gauge;