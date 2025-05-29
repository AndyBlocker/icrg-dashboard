import React, { useMemo } from 'react';
import { getGaugeColor, getUtilizationColor } from '../utils';

const Gauge = ({ 
  percentage, 
  label, 
  size = 80,
  strokeWidth = 6,
  showLabel = true,
  animated = true,
  className = ''
}) => {
  const validPercentage = Math.min(100, Math.max(0, percentage || 0));
  
  // 计算 SVG 参数
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (validPercentage / 100) * circumference;
  
  // 获取颜色
  const strokeColor = getGaugeColor(validPercentage);
  const textColor = getUtilizationColor(validPercentage);
  
  // 响应式文字大小
  const fontSize = useMemo(() => {
    if (size <= 50) return 'text-xs';
    if (size <= 80) return 'text-sm';
    if (size <= 120) return 'text-base';
    return 'text-lg';
  }, [size]);
  
  const labelFontSize = useMemo(() => {
    if (size <= 50) return 'text-xs';
    if (size <= 80) return 'text-xs';
    return 'text-sm';
  }, [size]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        className="transform -rotate-90"
      >
        {/* 背景圆环 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* 进度圆环 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={animated ? 'transition-all duration-1000 ease-out' : ''}
          style={{
            filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))'
          }}
        />
      </svg>
      
      {/* 中心内容 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${fontSize} ${textColor}`}>
          {validPercentage.toFixed(0)}%
        </span>
        {showLabel && label && (
          <span className={`${labelFontSize} text-gray-500 dark:text-gray-400 font-medium`}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default Gauge;