import dynamic from 'next/dynamic';
import { Card, List, Empty } from 'antd';
import styles from '../styles/ServerCard.module.css';
import { useEffect, useState, useRef } from 'react';
import ServerDetails from './ServerDetails';

const Progress = dynamic(() => import('antd/lib/progress'), { ssr: false });

const ServerCard = ({ server }) => {
  const cardRef = useRef(null);
  const [minHeight, setMinHeight] = useState(0);
  const [isWideScreen, setIsWideScreen] = useState(false);

  const cpuUsage = server.cpu_usage;
  const memoryUsage = server.memory_usage;
  const gpuInfo = server.gpu_info || [];
  const timestamp = server.timestamp;

  const averageGpuUsage = gpuInfo.length > 0 
    ? (gpuInfo.reduce((acc, gpu) => acc + gpu.utilization, 0) / gpuInfo.length).toFixed(2) 
    : 0;

  const totalMemoryUsed = gpuInfo.reduce((total, gpu) => total + gpu.memory_used, 0);
  const totalMemory = gpuInfo.reduce((total, gpu) => total + gpu.memory_total, 0);
  const memoryUsagePercent = totalMemory > 0 ? (totalMemoryUsed / totalMemory) * 100 : memoryUsage;

  const getUsageColor = (value) => {
    if (value < 50) return '#28a745';
    if (value < 75) return '#ffc107';
    return '#dc3545';
  };

  const [updateTime, setUpdateTime] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);

  const formatTimeDifference = (timestamp) => {
    const now = new Date();
    const lastUpdate = new Date(timestamp * 1000);
    const diffInSeconds = Math.floor((now - lastUpdate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day(s) ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour(s) ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute(s) ago`;
    } else {
      return `${diffInSeconds} second(s) ago`;
    }
  };

  useEffect(() => {
    setUpdateTime(formatTimeDifference(timestamp));
    const interval = setInterval(() => {
      setUpdateTime(formatTimeDifference(timestamp));
    }, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  const isRecentUpdate = new Date() - new Date(timestamp * 1000) < 60000;

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 初始化屏幕宽度检查
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (cardRef.current) {
      setMinHeight(cardRef.current.clientHeight);
    }
  }, [cardRef]);

  const renderProcessesByUser = (processes) => {
    const users = [...new Set(processes.map(p => p.user))]; // 获取所有独特的用户名
    return users.map(user => {
      const userProcesses = processes.filter(p => p.user === user);
      const totalMemoryGB = (userProcesses.reduce((acc, p) => acc + p.used_memory, 0) / 1024).toFixed(2); // 计算总共占用的内存，转换为GB
      return (
        <div key={user} className={styles.userGroup}>
          <div className={styles.userHeader}>
            <h4 className={styles.userName}>{user}</h4>
            <span className={styles.memoryUsage}>{totalMemoryGB} GB</span>
          </div>
          <List
            dataSource={userProcesses}
            renderItem={(item) => (
              <List.Item>
                <span>{item.full_cmd}</span>
              </List.Item>
            )}
          />
        </div>
      );
    });
  };
  

  return (
    <>
      <div className={styles.cardContainer}>
        <Card
          title={
            <div className={styles.cardTitle}>
              <div>
                {server.machine_name}
                <div className={styles.machineAlias}>{server.machine_alias}</div>
              </div>
              <span className={isRecentUpdate ? styles.greenText : styles.redText}>
                {updateTime}
              </span>
            </div>
          }
          className={styles.card}
          style={{ minHeight: `${minHeight}px` }}
          onClick={showDrawer}
          ref={cardRef}
        >
          <div className={styles.cardContent}>
            <div className={styles.circleContainer}>
              {server.server_type === 'GPU' ? (
                <>
                  <div className={styles.circleItem}>
                    <Progress
                      type="circle"
                      percent={averageGpuUsage}
                      format={percent => `${percent}%`}
                      strokeColor={getUsageColor(averageGpuUsage)}
                      width={100}
                    />
                    <div className={styles.circleLabel}>GPU Utilization</div>
                  </div>

                  <div className={styles.circleItem}>
                    <Progress
                      type="circle"
                      percent={memoryUsagePercent}
                      format={() => `${(totalMemoryUsed / 1024).toFixed(1)}GB / ${(totalMemory / 1024).toFixed(1)}GB`}
                      strokeColor={getUsageColor(memoryUsagePercent)}
                      width={100}
                    />
                    <div className={styles.circleLabel}>GPU Memory Usage</div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.circleItem}>
                    <Progress
                      type="circle"
                      percent={cpuUsage}
                      format={percent => `${percent}%`}
                      strokeColor={getUsageColor(cpuUsage)}
                      width={100}
                    />
                    <div className={styles.circleLabel}>CPU Usage</div>
                  </div>

                  <div className={styles.circleItem}>
                    <Progress
                      type="circle"
                      percent={memoryUsage}
                      format={percent => `${percent}%`}
                      strokeColor={getUsageColor(memoryUsage)}
                      width={100}
                    />
                    <div className={styles.circleLabel}>Memory Usage</div>
                  </div>
                </>
              )}
            </div>

            {isWideScreen && server.top_processes && server.top_processes.length > 0 ? (
            <div className={styles.processList}>
              {renderProcessesByUser(server.top_processes)}
            </div>
          ) : isWideScreen ? (
            <div className={styles.noData}>
              <Empty description="没有任务" />
            </div>
          ) : null}


          </div>
        </Card>
      </div>
      <ServerDetails server={server} visible={drawerVisible} onClose={closeDrawer} />
    </>
  );
};

export default ServerCard;
