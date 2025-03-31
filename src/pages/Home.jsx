import React, { useState, useEffect, useCallback } from 'react';
import { fetchCurrentStatus, fetchHistoryData, fetchDowntimeEvents } from '../services/api';
import Layout from '../components/Layout';
import ServerCard from '../components/ServerCard';
import ServerDetails from '../components/ServerDetails';
import DowntimeEvent from '../components/DowntimeEvent';
import Loading from '../components/Loading';

const Home = () => {
  const [servers, setServers] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [downtimeEvents, setDowntimeEvents] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 获取所有数据的函数
  const fetchAllData = useCallback(async () => {
    try {
      const [currentData, historyData, downtimeData] = await Promise.all([
        fetchCurrentStatus(),
        fetchHistoryData(),
        fetchDowntimeEvents()
      ]);
      
      // 服务器数据已经包含正确的ID，直接使用
      setServers(currentData);
      setHistoryData(historyData);
      setDowntimeEvents(downtimeData);
      setLoading(false);
      
    //   console.log('服务器数据:', currentData);
    //   console.log('历史数据:', historyData);
    //   console.log('停机事件数据:', downtimeData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('加载数据时出错，请刷新页面重试。');
      setLoading(false);
    }
  }, []);
  
  // 初始加载数据
  useEffect(() => {
    fetchAllData();
    
    // 设置自动刷新（每秒）
    const interval = setInterval(() => {
      fetchAllData();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [fetchAllData]);
  
  // 创建详情部分的引用
  const detailsRef = React.useRef(null);
  // 检测是否为移动设备的状态
  const [isMobile, setIsMobile] = useState(false);
  
  // 检测设备类型
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // 通常768px是移动设备的断点
    };
    
    // 初始检测
    checkIfMobile();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkIfMobile);
    
    // 清理监听器
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // 处理服务器卡片点击
  const handleServerClick = (server) => {
    // 如果点击的是已选择的服务器，则关闭详情
    if (selectedServer && selectedServer.machine_name === server.machine_name) {
      setSelectedServer(null);
      return;
    }
    
    // 设置选中的服务器
    setSelectedServer(server);
    
    // 仅在移动设备上自动滚动到详情部分
    if (isMobile) {
      setTimeout(() => {
        if (detailsRef.current) {
          detailsRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
          });
        }
      }, 100);
    }
  };
  
  // 关闭服务器详情面板
  const handleCloseDetails = () => {
    setSelectedServer(null);
  };
  
  // 获取最近的5个停机事件
  const recentDowntimeEvents = downtimeEvents
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
    .slice(0, 5);
  
  // 通过server_id找到对应的服务器名称
  const getServerNameById = (serverId) => {
    const server = servers.find(s => s.id === serverId);
    return server ? server.machine_name : `服务器ID: ${serverId}`;
  };
  
  if (loading) {
    return (
      <Layout>
        <Loading message="正在加载服务器数据..." />
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
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">服务器状态</h2>
        <button 
          onClick={fetchAllData}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{width: '16px', height: '16px', minWidth: '16px', minHeight: '16px'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8 max-w-7xl mx-auto">
        {servers.map((server) => (
          <ServerCard 
            key={server.machine_name}
            server={server}
            onClick={() => handleServerClick(server)}
            isSelected={selectedServer && selectedServer.machine_name === server.machine_name}
          />
        ))}
      </div>
      
      {selectedServer && (
        <div className="mb-8 animate-fade-in scroll-mt-4" ref={detailsRef}>
          <ServerDetails 
            server={selectedServer}
            historyData={historyData}
            onClose={handleCloseDetails}
          />
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">近期停机事件</h2>
          <a 
            href="/icrg_status/downtime"
            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
          >
            查看全部
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{width: '16px', height: '16px', minWidth: '16px', minHeight: '16px'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
        
        {recentDowntimeEvents.length > 0 ? (
          <div>
            {recentDowntimeEvents.map((event) => (
              <DowntimeEvent 
                key={`${event.server_id}-${event.start_time}`}
                event={event}
                serverName={getServerNameById(event.server_id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">暂无停机事件记录</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;