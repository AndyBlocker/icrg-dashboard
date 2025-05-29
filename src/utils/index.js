import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { THRESHOLDS, STATUS_TYPES } from '../constants';

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

// 格式化日期时间为紧凑格式（用于小卡片）
export const formatCompactDateTime = (dateString) => {
  if (!dateString) return '未知';
  
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    // 总是显示月日和时间，确保信息完整
    if (diffHours < 1) {
      // 1小时内：刚刚
      return '刚刚';
    } else if (diffHours < 24) {
      // 24小时内：今天 + 时间
      return `今天 ${format(date, 'HH:mm')}`;
    } else if (diffDays === 1) {
      // 昨天
      return `昨天 ${format(date, 'HH:mm')}`;
    } else if (diffDays < 7) {
      // 一周内：月日 + 时间
      return format(date, 'M/d HH:mm');
    } else {
      // 更早：也显示时间
      return format(date, 'M/d HH:mm');
    }
  } catch (e) {
    console.error('Error formatting date:', e);
    return '未知';
  }
};

// 格式化日期为YYYY-MM-DD格式
export const formatDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : parseISO(date);
    return format(dateObj, 'yyyy-MM-dd');
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
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

// 获取使用率状态
export const getUsageStatus = (usage, type = 'cpu') => {
  if (usage === null || usage === undefined) return STATUS_TYPES.UNKNOWN;
  
  const thresholds = THRESHOLDS[type] || THRESHOLDS.cpu;
  
  if (usage >= thresholds.danger) return STATUS_TYPES.OFFLINE;
  if (usage >= thresholds.warning) return STATUS_TYPES.WARNING;
  return STATUS_TYPES.ONLINE;
};

// 获取服务器在线状态
export const getServerStatus = (lastHeartbeat, offlineThreshold = 300000) => {
  if (!lastHeartbeat) return STATUS_TYPES.UNKNOWN;
  
  const now = new Date();
  const heartbeatTime = new Date(lastHeartbeat);
  const timeDiff = now - heartbeatTime;
  
  if (timeDiff > offlineThreshold) return STATUS_TYPES.OFFLINE;
  return STATUS_TYPES.ONLINE;
};

// 格式化字节大小
export const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// 防抖函数
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 获取状态颜色
export const getStatusColor = (status) => {
  switch (status) {
    case STATUS_TYPES.ONLINE:
      return 'text-green-600 dark:text-green-400';
    case STATUS_TYPES.WARNING:
      return 'text-yellow-600 dark:text-yellow-400';
    case STATUS_TYPES.OFFLINE:
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};