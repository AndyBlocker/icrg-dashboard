import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import ServerCard from '../components/ServerCard';
import ServerDetails from '../components/ServerDetails';
import DowntimeEvent from '../components/DowntimeEvent';
import CompactHeatmap from '../components/CompactHeatmap';
import Loading from '../components/Loading';
import Button from '../components/Button';
import ErrorBoundary from '../components/ErrorBoundary';
import { useServerData } from '../hooks/useServerData';
import { STYLES } from '../constants';

const Home = () => {
  const {
    servers,
    historyData,
    downtimeEvents,
    loading,
    error,
    lastUpdate,
    refreshData,
    getServerNameById
  } = useServerData();
  
  const [selectedServer, setSelectedServer] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const detailsRef = useRef(null);
  
  // 检测设备类型
  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // 处理服务器卡片点击
  const handleServerClick = React.useCallback((server) => {
    if (selectedServer && selectedServer.machine_name === server.machine_name) {
      setSelectedServer(null);
      return;
    }
    
    setSelectedServer(server);
    
    if (isMobile) {
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      }, 100);
    }
  }, [selectedServer, isMobile]);
  
  // 关闭服务器详情面板
  const handleCloseDetails = React.useCallback(() => {
    setSelectedServer(null);
  }, []);
  
  // 获取最近的4个停机事件（2行2列）
  const recentDowntimeEvents = React.useMemo(() => {
    return downtimeEvents
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 4);
  }, [downtimeEvents]);
  
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
          <Button onClick={refreshData} className="mt-3">
            重试
          </Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <ErrorBoundary>
      <Layout>
        {/* 头部区域 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                服务器监控仪表板
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                实时监控服务器状态和性能指标
              </p>
              {lastUpdate && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  最后更新: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
            <Button 
              onClick={refreshData}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              刷新数据
            </Button>
          </div>
        </div>
      
        {/* 服务器卡片网格 */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                服务器状态 
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({servers.length} 台服务器)
                </span>
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {servers.map((server) => (
              <ServerCard 
                key={server.machine_name}
                server={server}
                onClick={() => handleServerClick(server)}
                isSelected={selectedServer && selectedServer.machine_name === server.machine_name}
              />
            ))}
          </div>
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
      
        {/* 停机事件和热力图区域 */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    停机事件与趋势
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    90天热力图和最新事件记录
                  </p>
                </div>
                <a 
                  href="/icrg_status/downtime"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 rounded-lg transition-all duration-200"
                >
                  查看全部
                  <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  最近事件
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  最新的4个服务器停机记录
                </p>
              </div>
              
              {recentDowntimeEvents.length > 0 ? (
                <>
                  {/* 移动端和平板：上下布局 */}
                  <div className="xl:hidden space-y-4">
                    <CompactHeatmap downtimeEvents={downtimeEvents} />
                    <div className="space-y-3">
                      {recentDowntimeEvents.map((event) => (
                        <DowntimeEvent 
                          key={`${event.server_id}-${event.start_time}`}
                          event={event}
                          serverName={getServerNameById(event.server_id)}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* 桌面端：2行3列固定布局 */}
                  <div className="hidden xl:block">
                    <div className="grid grid-cols-3 grid-rows-2 gap-4 h-full">
                      {/* 热力图：占据第一列的两行 */}
                      <div className="row-span-2">
                        <CompactHeatmap downtimeEvents={downtimeEvents} />
                      </div>
                      
                      {/* 4个最近事件：占据剩余的2×2网格 */}
                      {recentDowntimeEvents.slice(0, 4).map((event, index) => (
                        <div key={`event-${event.server_id}-${event.start_time}`}>
                          <DowntimeEvent 
                            event={event}
                            serverName={getServerNameById(event.server_id)}
                          />
                        </div>
                      ))}
                      
                      {/* 如果事件少于4个，用占位符填充 */}
                      {Array.from({ length: Math.max(0, 4 - recentDowntimeEvents.length) }, (_, index) => (
                        <div key={`placeholder-${index}`} className="bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center p-4">
                          <div className="text-center text-gray-400 dark:text-gray-500">
                            <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm font-medium">无事件</div>
                            <div className="text-xs">暂无停机记录</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col xl:flex-row xl:items-start gap-6">
                  {/* 热力图 */}
                  <div className="xl:w-96 flex-shrink-0">
                    <CompactHeatmap downtimeEvents={downtimeEvents} />
                  </div>
                  
                  {/* 空状态 */}
                  <div className="flex-1 text-center py-8">
                    <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      系统运行稳定
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      暂无停机事件记录
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ErrorBoundary>
  );
};

export default Home;