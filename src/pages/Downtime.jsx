import React, { useState, useEffect, useMemo } from 'react';
import { fetchDowntimeEvents, fetchCurrentStatus } from '../services/api';
import Layout from '../components/Layout';
import DowntimeEvent from '../components/DowntimeEvent';
import Loading from '../components/Loading';

const Downtime = () => {
  const [downtimeEvents, setDowntimeEvents] = useState([]);
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [downtimeData, serversData] = await Promise.all([
          fetchDowntimeEvents(),
          fetchCurrentStatus()
        ]);
        
        // 添加服务器信息
        const serversWithIds = serversData.map(server => {
          // 查找该服务器名称对应的服务器ID
          const serverEvents = downtimeData.filter(
            event => event.server_id && event.server_id.toString()
          );
          
          // 如果找到匹配的停机事件，使用其server_id
          const serverId = serverEvents.length > 0 ? serverEvents[0].server_id : null;
          
          return {
            ...server,
            id: serverId
          };
        });
        
        setServers(serversWithIds);
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
  
  // 通过server_id找到对应的服务器信息
  const getServerById = (serverId) => {
    return servers.find(s => s.id === serverId) || { 
      machine_name: '未知服务器', 
      machine_alias: '' 
    };
  };
  
  // 根据过滤条件筛选停机事件
  const filteredEvents = useMemo(() => {
    if (filter === 'all') {
      return downtimeEvents;
    } else if (filter === 'active') {
      return downtimeEvents.filter(event => !event.end_time);
    } else {
      // 按服务器ID筛选
      return downtimeEvents.filter(event => event.server_id === parseInt(filter));
    }
  }, [downtimeEvents, filter]);
  
  // 对事件进行排序：先按结束时间（未结束的在前），再按开始时间倒序
  const sortedEvents = useMemo(() => {
    return filteredEvents.sort((a, b) => {
      // 未结束的事件排在前面
      if (!a.end_time && b.end_time) return -1;
      if (a.end_time && !b.end_time) return 1;
      
      // 按开始时间倒序排列
      return new Date(b.start_time) - new Date(a.start_time);
    });
  }, [filteredEvents]);
  
  // 服务器选项
  const serverOptions = useMemo(() => {
    const options = [];
    
    // 从所有事件中提取唯一的服务器ID
    const uniqueServerIds = [...new Set(downtimeEvents.map(event => event.server_id))];
    
    // 为每个ID找到对应的服务器信息
    uniqueServerIds.forEach(id => {
      const server = getServerById(id);
      options.push({
        id: id,
        name: server.machine_name,
        alias: server.machine_alias
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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">停机事件历史</h2>
          <a 
            href="/icrg_status"
            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{width: '16px', height: '16px', minWidth: '16px', minHeight: '16px'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            返回服务器状态
          </a>
        </div>
        
        <div className="mb-4">
          <label htmlFor="filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            筛选服务器:
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">所有服务器</option>
            <option value="active">当前离线的服务器</option>
            {serverOptions.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name} {server.alias ? `(${server.alias})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {sortedEvents.length > 0 ? (
        <div className="space-y-4">
          {sortedEvents.map((event) => {
            const server = getServerById(event.server_id);
            return (
              <DowntimeEvent 
                key={`${event.server_id}-${event.start_time}`}
                event={event}
                serverName={`${server.machine_name}${server.machine_alias ? ` (${server.machine_alias})` : ''}`}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            没有找到符合条件的停机事件记录
          </p>
        </div>
      )}
    </Layout>
  );
};

export default Downtime;