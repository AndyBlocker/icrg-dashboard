import dynamic from 'next/dynamic';
import { Card } from 'antd';
import { calculateAverageGpuUsage, calculateTotalMemoryUsage } from '../utils/utils';
import styles from '../styles/ServerCard.module.css';
import { useEffect, useState, useRef } from 'react';
import ServerDetails from './ServerDetails';

// 动态导入 Progress 组件，并禁用 SSR
const Progress = dynamic(() => import('antd/lib/progress'), { ssr: false });

const ServerCard = ({ server }) => {
  const cardRef = useRef(null);
  const [minHeight, setMinHeight] = useState(0);

  const cpuUsage = server.cpu_usage;
  const memoryUsage = server.memory_usage;
  const gpuInfo = server.gpu_info || [];
  const timestamp = server.timestamp;

  const averageGpuUsage = server.server_type === 'GPU' ? parseFloat(calculateAverageGpuUsage(gpuInfo)) : 0;
  const totalMemoryUsage = server.server_type === 'GPU' ? parseFloat(calculateTotalMemoryUsage(gpuInfo)) : memoryUsage;

  const getUsageColor = (value) => {
    if (value < 50) return '#28a745';
    if (value < 75) return '#ffc107';
    return '#dc3545';
  };

  const totalMemoryUsed = gpuInfo.reduce((total, gpu) => total + gpu.memory_used, 0);
  const totalMemory = gpuInfo.reduce((total, gpu) => total + gpu.memory_total, 0);
  const memoryUsagePercent = (totalMemoryUsed / totalMemory) * 100;

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
    if (cardRef.current) {
      setMinHeight(cardRef.current.clientHeight);
    }
  }, [cardRef]);

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
          style={{ minHeight: `${minHeight}px` }} // 设置卡片最小高度
          onClick={showDrawer}
          ref={cardRef}
        >
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
        </Card>
      </div>
      <ServerDetails server={server} visible={drawerVisible} onClose={closeDrawer} />
    </>
  );
};

export default ServerCard;
