import React, { useState, useEffect, useMemo } from 'react';
import { fetchDowntimeEvents, fetchCurrentStatus } from '../services/api';
import Layout from '../components/Layout';
import DowntimeEvent from '../components/DowntimeEvent';
import CompactHeatmap from '../components/CompactHeatmap';
import Loading from '../components/Loading';

const Downtime = () => {
  const [downtimeEvents, setDowntimeEvents] = useState([]);
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [downtimeData, serversData] = await Promise.all([
          fetchDowntimeEvents(),
          fetchCurrentStatus()
        ]);
        
        setServers(serversData);
        setDowntimeEvents(downtimeData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('加载数据时出错，请刷新页面重试。');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // 根据过滤条件筛选停机事件
  const filteredEvents = useMemo(() => {
    if (filter === 'all') {
      return downtimeEvents;
    } else if (filter === 'active') {
      return downtimeEvents.filter(event => !event.end_time);
    } else {
      return downtimeEvents.filter(event => event.server_id.toString() === filter);
    }
  }, [downtimeEvents, filter]);

  // 按开始时间排序（最新的在前）
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  }, [filteredEvents]);

  // 获取服务器选项用于筛选
  const serverOptions = useMemo(() => {
    const options = [];
    
    // 从所有事件中提取唯一的服务器ID
    const uniqueServerIds = [...new Set(downtimeEvents.map(event => event.server_id))];
    
    // 为每个ID找到对应的服务器信息
    uniqueServerIds.forEach(id => {
      const server = servers.find(s => s.id === id);
      options.push({
        id: id,
        name: server ? server.machine_name : `服务器 ${id}`,
        alias: server ? server.machine_alias : null
      });
    });
    
    return options.sort((a, b) => a.name.localeCompare(b.name));
  }, [downtimeEvents, servers]);
  
  if (loading) {
    return (
      <Layout>
        <Loading message="正在加载停机事件数据..." />
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="p-4 bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          <h3 className="text-lg font-semibold">错误</h3>
          <p>{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* 头部区域 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              停机事件历史
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              查看所有服务器的停机记录和恢复情况
            </p>
          </div>
          <a 
            href="/icrg_status/" 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 rounded-lg transition-all duration-200"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            返回仪表板
          </a>
        </div>
        
        {/* 筛选器 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label htmlFor="filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              筛选条件:
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 max-w-xs pl-3 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-lg dark:bg-gray-700 dark:text-white transition-colors duration-200"
            >
              <option value="all">所有服务器</option>
              <option value="active">当前离线的服务器</option>
              {serverOptions.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name} {server.alias ? `(${server.alias})` : ''}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              共 {sortedEvents.length} 条记录
            </div>
          </div>
        </div>
      </div>
      
      {/* 热力图区域 */}
      <CompactHeatmap 
        downtimeEvents={downtimeEvents}
        className="mb-8"
      />
      
      {/* 停机事件列表 */}
      {sortedEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {sortedEvents.map((event) => {
            const server = servers.find(s => s.id === event.server_id);
            const serverName = server ? server.machine_name : `服务器 ${event.server_id}`;
            return (
              <DowntimeEvent 
                key={`${event.server_id}-${event.start_time}`}
                event={event}
                serverName={serverName}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
            没有找到停机事件
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {filter === 'all' ? '所有服务器运行正常，没有停机记录' : '当前筛选条件下没有找到相关记录'}
          </p>
        </div>
      )}
    </Layout>
  );
};

export default Downtime;