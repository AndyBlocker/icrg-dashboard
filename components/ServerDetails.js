import { Drawer, Typography, Space, Divider, Descriptions, Progress } from 'antd';
import { useEffect, useState } from 'react';
import AvailabilityBar from './AvailabilityBar';

const { Title, Text } = Typography;

const ServerDetails = ({ server, visible, onClose }) => {
  const [drawerWidth, setDrawerWidth] = useState(640);
  const [eventData, setEventData] = useState([]);
  const [availabilityData, setAvailabilityData] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setDrawerWidth('100%');
      } else {
        setDrawerWidth('80%');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize width on component mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (server) {
      fetch(`https://www.andyblocker.top/api/get_event_data?server_name=${server.machine_name}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => setEventData(data))
        .catch((err) => {
          console.error('Error fetching event data:', err);
        });

      fetch(`https://www.andyblocker.top/api/get_availability_data?server_name=${server.machine_name}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => setAvailabilityData(data))
        .catch((err) => {
          console.error('Error fetching availability data:', err);
        });
    }
  }, [server]);

  if (!server) return null;

  const getUsageColor = (value) => {
    if (value < 50) return '#28a745';
    if (value < 75) return '#ffc107';
    return '#dc3545';
  };

  const formatMemoryUsage = (used, total) => {
    return `${(used / 1024).toFixed(1)}GB / ${(total / 1024).toFixed(1)}GB`;
  };

  const formatDuration = (seconds) => {
    if (seconds >= 3600) {
      const hours = (seconds / 3600).toFixed(1);
      return `${hours} hours`;
    } else {
      const minutes = (seconds / 60).toFixed(1);
      return `${minutes} minutes`;
    }
  };

  const cpuUsage = parseFloat(server.cpu_usage.toFixed(2));
  const memoryUsage = parseFloat(((server.memory_used / server.memory_total) * 100).toFixed(2));

  const progressBarContainerStyle = {
    position: 'relative',
    width: '100%',
  };

  const progressBarStyle = {
    width: '100%',
    transition: 'width 0.5s ease-in-out',
    position: 'relative',
    top: '-8px', // Adjust the top property to make the progress bar overlap with the text
  };

  return (
    <Drawer
      title={`${server.machine_alias} - ${server.machine_name}`}
      placement="right"
      closable={true}
      onClose={onClose}
      visible={visible}
      width={drawerWidth}
    >
      <Space direction="vertical" size="small" style={{ display: 'flex' }}>
        <div>
          <Title level={3}>Overview</Title>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Name">{server.machine_name}</Descriptions.Item>
            <Descriptions.Item label="Server Type">{server.server_type}</Descriptions.Item>
            <Descriptions.Item label="Memory">{formatMemoryUsage(server.memory_used, server.memory_total)}</Descriptions.Item>
            <Descriptions.Item label="GPU Count">{server.gpu_info.length}</Descriptions.Item>
            <Descriptions.Item label="Status">{server.network_status}</Descriptions.Item>
          </Descriptions>
        </div>
        <Divider />
        <div>
          <Title level={3}>CPU Usage</Title>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text type="secondary">CPU Usage:</Text>
            <div style={{ ...progressBarContainerStyle }}>
              <Progress
                percent={cpuUsage}
                format={(percent) => `${percent}%`}
                strokeColor={getUsageColor(cpuUsage)}
                style={{ ...progressBarStyle }}
              />
            </div>
            <Text type="secondary">Memory Usage:</Text>
            <div style={{ ...progressBarContainerStyle }}>
              <Progress
                percent={memoryUsage}
                format={() => formatMemoryUsage(server.memory_used, server.memory_total)}
                strokeColor={getUsageColor(memoryUsage)}
                style={{ ...progressBarStyle }}
              />
            </div>
          </Space>
        </div>
        <Divider />
        <div>
          <Title level={3}>GPU Usage</Title>
          {server.gpu_info.map((gpu, index) => {
            const memoryUsagePercent = parseFloat(((gpu.memory_used / gpu.memory_total) * 100).toFixed(2));
            return (
              <div key={index} style={{ marginBottom: '12px' }}>
                <Title level={5} color="gray">{gpu.name}</Title>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text type="secondary">GPU Utilization:</Text>
                  <div style={{ ...progressBarContainerStyle }}>
                    <Progress
                      percent={gpu.utilization}
                      format={(percent) => `${percent}%`}
                      strokeColor={getUsageColor(gpu.utilization)}
                      style={{ ...progressBarStyle }}
                    />
                  </div>
                  <Text type="secondary">Memory Usage:</Text>
                  <div style={{ ...progressBarContainerStyle }}>
                    <Progress
                      percent={memoryUsagePercent}
                      format={() => formatMemoryUsage(gpu.memory_used, gpu.memory_total)}
                      strokeColor={getUsageColor(memoryUsagePercent)}
                      style={{ ...progressBarStyle }}
                    />
                  </div>
                </Space>
              </div>
            );
          })}
        </div>
        <Divider />
        <div>
          <Title level={3}>Availability</Title>
          <AvailabilityBar data={availabilityData} totalDays={90} />
          {availabilityData.length > 0 && (
            <div>
              <Title level={4}>Detailed Events</Title>
              {availabilityData.map((event, index) => (
                <div key={index}>
                  <Text>
                    {new Date(event.timestamp * 1000).toLocaleString()}: {event.event} - Duration: {formatDuration(event.details.duration)}
                  </Text>
                  <br />
                </div>
              ))}
            </div>
          )}
        </div>
      </Space>
    </Drawer>
  );
};

export default ServerDetails;
