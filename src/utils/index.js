import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 从字符串解析GPU信息
export const parseGpuInfo = (gpuInfoStr) => {
  if (!gpuInfoStr || gpuInfoStr === 'No GPU Info Available' || gpuInfoStr.includes('No GPU Info - This is a CPU Server')) {
    return [];
  }

  const gpuLines = gpuInfoStr.split('\n');
  const gpus = [];

  gpuLines.forEach(line => {
    const match = line.match(/Name: (.*?), Utilization: (.*?)%, Used Memory: (.*?) MB, Total Memory: (.*?) MB/);
    if (match) {
      gpus.push({
        name: match[1],
        utilization: parseFloat(match[2]),
        usedMemory: parseInt(match[3], 10),
        totalMemory: parseInt(match[4], 10),
        memoryUtilization: (parseInt(match[3], 10) / parseInt(match[4], 10) * 100).toFixed(1)
      });
    }
  });

  return gpus;
};

// 解析顶部进程信息
export const parseTopProcesses = (processesStr) => {
  if (!processesStr) return [];

  const processLines = processesStr.split('\n');
  const processes = [];

  processLines.forEach(line => {
    // 尝试匹配多种可能的格式
    const match = line.match(/PID: (.*?), (?:Process Name: )?(.*?), User: (.*?), Used Memory: (.*?) MB(?:, GPUs: (.*))?/);
    if (match) {
      processes.push({
        pid: match[1],
        name: match[2],
        user: match[3],
        usedMemory: parseInt(match[4], 10),
        gpus: match[5] ? match[5].split(', ') : []
      });
    }
  });

  return processes;
};

// 获取不同利用率对应的颜色
export const getUtilizationColor = (percentage) => {
  if (percentage >= 90) return 'text-red-500 dark:text-red-400';
  if (percentage >= 70) return 'text-orange-500 dark:text-orange-400';
  if (percentage >= 50) return 'text-yellow-500 dark:text-yellow-400';
  return 'text-green-500 dark:text-green-400';
};

// 获取仪表盘背景颜色
export const getGaugeColor = (percentage) => {
  if (percentage >= 90) return '#ef4444';
  if (percentage >= 70) return '#f97316';
  if (percentage >= 50) return '#eab308';
  return '#22c55e';
};

// 格式化最后更新时间为"x分钟前"格式
export const formatLastUpdated = (dateString) => {
  if (!dateString) return '未知';
  
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
  } catch (e) {
    console.error('Error formatting date:', e);
    return '未知';
  }
};

// 格式化日期时间为本地格式
export const formatDateTime = (dateString) => {
  if (!dateString) return '未知';
  
  try {
    const date = parseISO(dateString);
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  } catch (e) {
    console.error('Error formatting date:', e);
    return '未知';
  }
};

// 计算平均GPU利用率
export const calculateAverageGpuUtilization = (gpus) => {
  if (!gpus || gpus.length === 0) return 0;
  
  const sum = gpus.reduce((acc, gpu) => acc + gpu.utilization, 0);
  return (sum / gpus.length).toFixed(1);
};

// 计算平均GPU内存利用率
export const calculateAverageGpuMemoryUtilization = (gpus) => {
  if (!gpus || gpus.length === 0) return 0;
  
  const sum = gpus.reduce((acc, gpu) => acc + parseFloat(gpu.memoryUtilization), 0);
  return (sum / gpus.length).toFixed(1);
};

// 格式化时间间隔为可读格式
export const formatDuration = (startTime, endTime) => {
  if (!startTime) return '未知';
  
  const start = parseISO(startTime);
  const end = endTime ? parseISO(endTime) : new Date();
  
  const diffSeconds = Math.floor((end - start) / 1000);
  
  const days = Math.floor(diffSeconds / 86400);
  const hours = Math.floor((diffSeconds % 86400) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  
  let result = '';
  if (days > 0) result += `${days}天 `;
  if (hours > 0 || days > 0) result += `${hours}小时 `;
  result += `${minutes}分钟`;
  
  return result;
};

// 从历史数据中提取用户名列表
export const extractUsersFromHistory = (historyData) => {
  const users = new Set();
  
  historyData.forEach(record => {
    if (record.details) {
      try {
        const details = JSON.parse(record.details);
        if (details.top_users) {
          details.top_users.forEach(user => {
            if (user.user) users.add(user.user);
          });
        }
      } catch (e) {
        console.error('Error parsing history details:', e);
      }
    }
  });
  
  return Array.from(users);
};