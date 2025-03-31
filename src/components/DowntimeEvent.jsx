import React from 'react';
import { formatDateTime, formatDuration } from '../utils';

const DowntimeEvent = ({ event, serverName }) => {
  const isOngoing = !event.end_time;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-3 border-l-4 border-red-500">
      <div className="flex justify-between">
        <h4 className="font-medium text-gray-800 dark:text-white">
          {serverName || '未知服务器'}
        </h4>
        <span className={`text-sm px-2 py-0.5 rounded-full ${
          isOngoing 
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }`}>
          {isOngoing ? '正在进行' : '已恢复'}
        </span>
      </div>
      
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">开始时间</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {formatDateTime(event.start_time)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isOngoing ? '当前状态' : '结束时间'}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {isOngoing ? '离线中' : formatDateTime(event.end_time)}
          </p>
        </div>
      </div>
      
      <div className="mt-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">持续时间</p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {formatDuration(event.start_time, event.end_time)}
        </p>
      </div>
    </div>
  );
};

export default DowntimeEvent;