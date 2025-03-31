import React, { useMemo } from 'react';
import Gauge from './Gauge';
import { 
  parseGpuInfo, 
  parseTopProcesses,
  formatLastUpdated,
  calculateAverageGpuUtilization,
  calculateAverageGpuMemoryUtilization
} from '../utils';

const ServerCard = ({ server, onClick, isSelected }) => {
  const gpuInfo = useMemo(() => parseGpuInfo(server.gpu_info), [server.gpu_info]);
  const topProcesses = useMemo(() => parseTopProcesses(server.top_processes), [server.top_processes]);
  
  // 获取主要用户（取内存使用最多的3个进程的用户）
  const mainUsers = useMemo(() => {
    if (!topProcesses || topProcesses.length === 0) return [];
    
    const userMap = new Map();
    
    topProcesses.forEach(process => {
      if (process.user && process.user !== 'Unknown') {
        if (!userMap.has(process.user)) {
          userMap.set(process.user, {
            user: process.user,
            totalMemory: 0
          });
        }
        userMap.get(process.user).totalMemory += process.usedMemory || 0;
      }
    });
    
    return Array.from(userMap.values())
      .sort((a, b) => b.totalMemory - a.totalMemory)
      .slice(0, 3);
  }, [topProcesses]);
  
  // 判断是否是GPU服务器
  const isGpuServer = useMemo(() => {
    return server.server_type === 'GPU' && gpuInfo.length > 0;
  }, [server.server_type, gpuInfo]);
  
  // 计算平均GPU利用率和显存利用率
  const avgGpuUtilization = useMemo(() => 
    calculateAverageGpuUtilization(gpuInfo), [gpuInfo]);
    
  const avgGpuMemoryUtilization = useMemo(() => 
    calculateAverageGpuMemoryUtilization(gpuInfo), [gpuInfo]);
  
  return (
    <div 
      className={`card-gradient rounded-xl shadow-md p-4 transition-all-300 cursor-pointer 
        hover:shadow-lg hover:scale-[1.02] ${isSelected ? 'ring-2 ring-primary-500 scale-[1.02]' : ''}`} 
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {server.machine_name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {server.machine_alias || '未命名服务器'}
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          更新于 {formatLastUpdated(server.last_heartbeat)}
        </div>
      </div>
      
      <div className="flex justify-center items-center gap-6 my-4">
        {isGpuServer ? (
          <>
            <Gauge percentage={avgGpuUtilization} label="GPU 利用率" />
            <Gauge percentage={avgGpuMemoryUtilization} label="GPU 显存" />
          </>
        ) : (
          <>
            <Gauge percentage={server.cpu_usage} label="CPU 利用率" />
            <Gauge percentage={server.mem_usage} label="内存利用率" />
          </>
        )}
      </div>
      
      {mainUsers.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">主要用户</h4>
          <div className="flex flex-wrap gap-2">
            {mainUsers.map((userInfo, idx) => (
              <div 
                key={`${userInfo.user}-${idx}`} 
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
              >
                {userInfo.user} ({Math.round(userInfo.totalMemory / 1024)}GB)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerCard;