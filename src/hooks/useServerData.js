import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCurrentStatus, fetchHistoryData, fetchDowntimeEvents } from '../services/api';

export const useServerData = () => {
  const [servers, setServers] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [downtimeEvents, setDowntimeEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const intervalRef = useRef(null);
  const isRefreshing = useRef(false);

  const fetchAllData = useCallback(async (showLoading = false) => {
    if (isRefreshing.current) return;
    
    isRefreshing.current = true;
    
    if (showLoading) {
      setLoading(true);
    }

    try {
      const [currentData, historyDataResult, downtimeData] = await Promise.all([
        fetchCurrentStatus(),
        fetchHistoryData(),
        fetchDowntimeEvents()
      ]);
      
      setServers(currentData);
      setHistoryData(historyDataResult);
      setDowntimeEvents(downtimeData);
      setError(null);
      setLastUpdate(new Date());
      
      if (showLoading) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('加载数据时出错，请刷新页面重试。');
      
      if (showLoading) {
        setLoading(false);
      }
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  const startAutoRefresh = useCallback((interval = 1000) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      fetchAllData(false);
    }, interval);
  }, [fetchAllData]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refreshData = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  useEffect(() => {
    fetchAllData(true);
    startAutoRefresh();
    
    return () => {
      stopAutoRefresh();
    };
  }, [fetchAllData, startAutoRefresh, stopAutoRefresh]);

  const getServerNameById = useCallback((serverId) => {
    const server = servers.find(s => s.id === serverId);
    if (server) {
      return server.machine_name || `服务器 ${serverId}`;
    }
    return `服务器 ${serverId}`;
  }, [servers]);

  return {
    servers,
    historyData,
    downtimeEvents,
    loading,
    error,
    lastUpdate,
    refreshData,
    getServerNameById,
    startAutoRefresh,
    stopAutoRefresh
  };
};