import React from 'react';
import { Tooltip } from 'antd';

const AvailabilityBar = ({ data, totalDays = 90 }) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const dayWidth = 100 / totalDays;
  const barHeight = '30px';

  const getBarColor = (events) => {
    if (events.length === 0) return '#28a745'; // Green for available
    const totalDuration = events.reduce((sum, event) => sum + (event.details.duration || 0), 0);
    if (totalDuration < 3 * 60 * 60) return '#ffc107'; // Yellow for events < 3 hours
    return '#dc3545'; // Red for events >= 3 hours
  };

  const renderBars = () => {
    const bars = [];
    for (let i = 0; i < totalDays; i++) {
      const dayStart = currentTime - (totalDays - i) * 24 * 3600;
      const dayEnd = dayStart + 24 * 3600;
      const dayEvents = data.filter(
        (event) => event.timestamp >= dayStart && event.timestamp < dayEnd
      );

      const barColor = getBarColor(dayEvents);
      const tooltipTitle = (
        <div>
          <strong>{new Date(dayStart * 1000).toLocaleDateString()}</strong>
          {dayEvents.length === 0 ? (
            <div>No downtime recorded on this day</div>
          ) : (
            dayEvents.map(event => (
              <div key={event.timestamp}>
                <strong>{new Date(event.timestamp * 1000).toLocaleString()}</strong>: {event.event}
                <br />
                Duration: {event.details.duration} seconds
              </div>
            ))
          )}
        </div>
      );

      bars.push(
        <Tooltip title={tooltipTitle} key={i}>
          <div
            style={{
              display: 'inline-block',
              width: `${dayWidth}%`,
              height: barHeight,
              backgroundColor: barColor,
              marginLeft: '1px',
              marginRight: '1px',
            }}
          ></div>
        </Tooltip>
      );
    }
    return bars;
  };

  const calculateUptime = () => {
    const totalUptimeSeconds = totalDays * 24 * 3600;
    const totalDowntimeSeconds = data.reduce((sum, event) => sum + (event.details.duration || 0), 0);
    const uptimePercentage = ((totalUptimeSeconds - totalDowntimeSeconds) / totalUptimeSeconds) * 100;
    return uptimePercentage.toFixed(2);
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex' }}>{renderBars()}</div>
      <div style={{ marginTop: '10px', color: 'gray', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
        <span>{totalDays} days ago</span>
        <span>{calculateUptime()}% uptime</span>
        <span>Today</span>
      </div>
    </div>
  );
};

export default AvailabilityBar;
