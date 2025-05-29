import React from 'react';
import { getServerStatus, getStatusColor } from '../utils';
import { STATUS_TYPES } from '../constants';

const StatusIndicator = ({ 
  lastHeartbeat, 
  size = 'medium', 
  showText = true, 
  offlineThreshold = 300000 
}) => {
  const status = getServerStatus(lastHeartbeat, offlineThreshold);
  const colorClass = getStatusColor(status);
  
  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  };
  
  const dotClass = sizeClasses[size] || sizeClasses.medium;
  
  const statusText = {
    [STATUS_TYPES.ONLINE]: '在线',
    [STATUS_TYPES.OFFLINE]: '离线',
    [STATUS_TYPES.WARNING]: '警告',
    [STATUS_TYPES.UNKNOWN]: '未知'
  };
  
  const getDotColor = (status) => {
    switch (status) {
      case STATUS_TYPES.ONLINE:
        return 'bg-green-500';
      case STATUS_TYPES.WARNING:
        return 'bg-yellow-500';
      case STATUS_TYPES.OFFLINE:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`${dotClass} ${getDotColor(status)} rounded-full flex-shrink-0 ${
        status === STATUS_TYPES.ONLINE ? 'animate-pulse' : ''
      }`} />
      {showText && (
        <span className={`text-sm font-medium ${colorClass}`}>
          {statusText[status]}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;