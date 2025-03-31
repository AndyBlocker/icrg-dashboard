import React, { useMemo } from 'react';
import { 
  parseGpuInfo, 
  parseTopProcesses, 
  formatLastUpdated,
  getUtilizationColor 
} from '../utils';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

// 注册Chart.js组件
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ServerDetails = ({ server, historyData, onClose }) => {
  const gpuInfo = useMemo(() => parseGpuInfo(server.gpu_info), [server.gpu_info]);
  const topProcesses = useMemo(() => parseTopProcesses(server.top_processes), [server.top_processes]);
  
  // 过滤当前服务器的历史数据
  const serverHistory = useMemo(() => {
    if (!historyData || !historyData.length) return [];
    return historyData
      .filter(item => item.server_id === server.id)
      .sort((a, b) => new Date(a.period_start) - new Date(b.period_start));
  }, [historyData, server.id]);
  
  // 准备图表数据
  const chartData = useMemo(() => {
    const labels = serverHistory.map(item => 
      format(parseISO(item.period_start), 'MM-dd HH:mm')
    );
    
    return {
      labels,
      datasets: [
        {
          label: 'CPU利用率 (%)',
          data: serverHistory.map(item => item.avg_cpu_usage),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: '内存利用率 (%)',
          data: serverHistory.map(item => item.avg_mem_usage),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        ...(server.server_type === 'GPU' ? [{
          label: 'GPU利用率 (%)',
          data: serverHistory.map(item => item.avg_gpu_usage),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        }] : []),
      ],
    };
  }, [serverHistory, server.server_type]);
  
  // 图表配置
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '历史利用率',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
      }
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {server.machine_name}
            <span className="ml-2 text-lg font-normal text-gray-600 dark:text-gray-300">
              ({server.machine_alias || '未命名服务器'})
            </span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            类型: {server.server_type === 'GPU' ? 'GPU服务器' : 'CPU服务器'} | 
            更新于 {formatLastUpdated(server.last_heartbeat)}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{width: '24px', height: '24px', minWidth: '24px', minHeight: '24px'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* 总体资源使用情况 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">CPU利用率</p>
          <p className={`text-2xl font-semibold ${getUtilizationColor(server.cpu_usage)}`}>
            {server.cpu_usage ? server.cpu_usage.toFixed(1) : 0}%
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">内存利用率</p>
          <p className={`text-2xl font-semibold ${getUtilizationColor(server.mem_usage)}`}>
            {server.mem_usage ? server.mem_usage.toFixed(1) : 0}%
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">总内存</p>
          <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {server.mem_total ? (server.mem_total / 1024).toFixed(1) : 0} GB
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">已用内存</p>
          <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {server.mem_used ? (server.mem_used / 1024).toFixed(1) : 0} GB
          </p>
        </div>
      </div>
      
      {/* GPU信息（如果是GPU服务器） */}
      {server.server_type === 'GPU' && gpuInfo.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">GPU信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {gpuInfo.map((gpu, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {gpu.name}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">利用率</p>
                    <p className={`text-lg font-semibold ${getUtilizationColor(gpu.utilization)}`}>
                      {gpu.utilization}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">显存</p>
                    <p className={`text-lg font-semibold ${getUtilizationColor(gpu.memoryUtilization)}`}>
                      {gpu.memoryUtilization}%
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">已用/总显存</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {(gpu.usedMemory / 1024).toFixed(1)} / {(gpu.totalMemory / 1024).toFixed(1)} GB
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 主要进程 */}
      {topProcesses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            主要进程 (Top {topProcesses.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">PID</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">进程名</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">用户</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">内存使用</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">GPU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topProcesses.map((process, index) => (
                  <tr key={`${process.pid}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{process.pid}</td>
                    <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate">
                      {process.name === "Unknown Command" ? "未知命令" : process.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                      {process.user === "Unknown" ? "未知用户" : process.user}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                      {process.usedMemory < 1024 
                        ? `${process.usedMemory} MB` 
                        : `${(process.usedMemory / 1024).toFixed(2)} GB`}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                      {process.gpus && process.gpus.length > 0 ? (
                        <span className="text-xs">
                          {process.gpus.length > 1 ? `${process.gpus.length}个GPU` : "1个GPU"}
                        </span>
                      ) : "无"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 历史利用率图表 */}
      {serverHistory.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">历史利用率</h3>
          <div className="w-full max-w-4xl mx-auto h-48 md:h-64 px-2">
            <Line options={{
              ...chartOptions,
              maintainAspectRatio: false,
              responsive: true,
            }} data={chartData} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            每小时聚合数据，保存最近90天
          </p>
        </div>
      )}
    </div>
  );
};

export default ServerDetails;