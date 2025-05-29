import React from 'react';
import { formatCompactDateTime, formatDuration } from '../utils';

const DowntimeEvent = ({ event, serverName }) => {
  const isOngoing = !event.end_time;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* 状态条 */}
      <div className={`h-1 ${isOngoing ? 'bg-red-500' : 'bg-green-500'}`}></div>
      
      <div className="p-3 sm:p-4">
        {/* 头部信息 */}
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
              {serverName || '未知服务器'}
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              停机事件记录
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isOngoing 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                isOngoing ? 'bg-red-500 animate-pulse' : 'bg-green-500'
              }`}></div>
              {isOngoing ? '离线中' : '已恢复'}
            </span>
          </div>
        </div>
        
        {/* 详细信息网格 - 优化为2列布局 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {/* 时间信息 */}
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              开始
            </div>
            <div className="text-gray-900 dark:text-white font-semibold text-sm">
              {formatCompactDateTime(event.start_time)}
            </div>
          </div>
          
          {/* 持续时间 */}
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              持续
            </div>
            <div className={`font-semibold text-sm ${
              isOngoing ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            }`}>
              {formatDuration(event.start_time, event.end_time)}
            </div>
          </div>
        </div>
        
        {/* 简化的底部信息 */}
        {isOngoing && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                结束时间: {isOngoing ? '进行中' : formatCompactDateTime(event.end_time)}
              </span>
              <span className="text-red-500 dark:text-red-400 font-medium animate-pulse">
                实时监控中
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DowntimeEvent;