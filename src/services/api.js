import axios from 'axios';

// 创建API基础配置
const api = axios.create({
  baseURL: 'https://api.mer.dev',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 获取所有服务器的当前状态
export const fetchCurrentStatus = async () => {
  try {
    const response = await api.get('/icrg_status/current');
    return response.data;
  } catch (error) {
    console.error('Error fetching current status:', error);
    throw error;
  }
};

// 获取所有服务器的历史数据
export const fetchHistoryData = async () => {
  try {
    const response = await api.get('/icrg_status/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching history data:', error);
    throw error;
  }
};

// 获取所有服务器的停机事件
export const fetchDowntimeEvents = async () => {
  try {
    const response = await api.get('/icrg_status/downtime');
    return response.data;
  } catch (error) {
    console.error('Error fetching downtime events:', error);
    throw error;
  }
};

// 获取特定用户的资源使用统计
export const fetchUserStats = async (username, days = 7) => {
  try {
    const response = await api.get(`/icrg_status/user_stats?username=${username}&days=${days}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

export default api;