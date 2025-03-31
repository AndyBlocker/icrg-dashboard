import React from 'react';

const Loading = ({ message = "加载中..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="flex items-center justify-center space-x-2 animate-bounce">
        <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
        <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
        <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
      </div>
      <p className="mt-4 text-gray-700 dark:text-gray-300">{message}</p>
    </div>
  );
};

export default Loading;