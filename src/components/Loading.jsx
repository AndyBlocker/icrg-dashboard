import React from 'react';

const Loading = ({ message = "加载中...", size = "medium" }) => {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8", 
    large: "w-12 h-12"
  };

  const dotSizes = {
    small: "w-1.5 h-1.5",
    medium: "w-2 h-2",
    large: "w-3 h-3"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 animate-fade-in">
      {/* 现代加载动画 */}
      <div className="relative">
        {/* 外圈旋转 */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin`}>
          <div className="border-t-4 border-primary-500 rounded-full w-full h-full animate-pulse"></div>
        </div>
        
        {/* 内部脉冲点 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${dotSizes[size]} bg-primary-500 rounded-full animate-ping`}></div>
        </div>
      </div>
      
      {/* 文字和波浪动画 */}
      <div className="mt-6 text-center">
        <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">{message}</p>
        
        {/* 波浪进度条 */}
        <div className="flex items-center justify-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s'
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;