import { useEffect, useState } from 'react';
import { Card } from 'antd';
import ServerCard from '../components/ServerCard';
import { fetchSummary } from '../utils/api';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [servers, setServers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchSummary();
        setServers(data.servers);
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <h1 className="text-center">ICRG Server Dashboard</h1>
      <div className={styles.listContainer}>
        {servers.map(server => (
          <div key={server.machine_name} className={styles.listItem}>
            <ServerCard server={server} />
          </div>
        ))}
      </div>
    </div>
  );
}
