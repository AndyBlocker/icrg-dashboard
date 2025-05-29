import React, { useMemo } from 'react';
import Gauge from './Gauge';
import Card from './Card';
import { 
  parseGpuInfo, 
  parseTopProcesses,
  formatLastUpdated,
  calculateAverageGpuUtilization,
  calculateAverageGpuMemoryUtilization
} from '../utils';
import { SERVER_TYPES } from '../constants';

const ServerCard = ({ server, onClick, isSelected = false }) => {
  // 解析数据
  const gpuData = useMemo(() => parseGpuInfo(server.gpu_info), [server.gpu_info]);
  const processData = useMemo(() => parseTopProcesses(server.top_processes), [server.top_processes]);
  
  // 获取主要用户（最多显示2个）
  const mainUsers = useMemo(() => {
    if (!processData?.length) return [];
    
    const userMap = new Map();
    
    processData.forEach(process => {
      if (process.user && process.user !== 'Unknown') {
        if (!userMap.has(process.user)) {
          userMap.set(process.user, { user: process.user, totalMemory: 0 });
        }
        userMap.get(process.user).totalMemory += process.usedMemory || 0;
      }
    });
    
    return Array.from(userMap.values())
      .sort((a, b) => b.totalMemory - a.totalMemory)
      .slice(0, 2); // 只显示前2个用户
  }, [processData]);
  
  // 计算GPU相关数据
  const isGpuServer = server.server_type === SERVER_TYPES.GPU && gpuData.length > 0;
  const avgGpuUtilization = useMemo(() => calculateAverageGpuUtilization(gpuData), [gpuData]);
  const avgGpuMemoryUtilization = useMemo(() => calculateAverageGpuMemoryUtilization(gpuData), [gpuData]);
  
  // 服务器类型标签样式
  const getTypeTagClasses = (type) => {
    return type === SERVER_TYPES.GPU 
      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
      : 'bg-gradient-to-r from-green-500 to-teal-600 text-white';
  };

  return (
    <Card
      clickable
      selected={isSelected}
      onClick={() => onClick(server)}
      className="p-3 sm:p-4 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl group"
    >
      {/* 服务器标题和状态 */}
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {server.machine_name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {server.machine_alias || '服务器'}
          </p>
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full shadow-sm ${getTypeTagClasses(server.server_type)}`}>
            {server.server_type}
          </span>
          <div className="text-xs text-gray-400 dark:text-gray-500 text-right">
            {formatLastUpdated(server.last_heartbeat)}
          </div>
        </div>
      </div>

      {/* 紧凑的资源仪表盘 */}
      <div className="flex justify-center space-x-4 sm:space-x-6 mb-3 sm:mb-4">
        {isGpuServer ? (
          <>
            <div className="text-center">
              <Gauge 
                percentage={avgGpuUtilization} 
                size={60}
                strokeWidth={4}
                className="sm:w-[70px] sm:h-[70px]"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">GPU</p>
            </div>
            <div className="text-center">
              <Gauge 
                percentage={avgGpuMemoryUtilization} 
                size={60}
                strokeWidth={4}
                className="sm:w-[70px] sm:h-[70px]"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">显存</p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <Gauge 
                percentage={server.cpu_usage || 0} 
                size={60}
                strokeWidth={4}
                className="sm:w-[70px] sm:h-[70px]"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">CPU</p>
            </div>
            <div className="text-center">
              <Gauge 
                percentage={server.mem_usage || 0} 
                size={60}
                strokeWidth={4}
                className="sm:w-[70px] sm:h-[70px]"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">内存</p>
            </div>
          </>
        )}
      </div>

      {/* 主要用户（紧凑显示） */}
      {mainUsers.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center">
          {mainUsers.map((userInfo, idx) => (
            <span 
              key={`${userInfo.user}-${idx}`} 
              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300"
            >
              {userInfo.user}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
};

export default React.memo(ServerCard);