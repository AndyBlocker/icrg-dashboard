import React, { useMemo } from 'react';
import ActivityCalendar from 'react-activity-calendar';
import { formatDate } from '../utils';

const CompactHeatmap = ({ downtimeEvents, className = '' }) => {
  // 处理停机事件数据，转换为react-activity-calendar需要的格式
  const calendarData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 89); // 90天前
    
    // 初始化所有日期的数据
    const dataMap = new Map();
    
    // 生成过去90天的所有日期
    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = formatDate(date);
      dataMap.set(dateKey, {
        date: dateKey,
        count: 0,
        level: 0
      });
    }
    
    // 去重：基于完整事件签名
    const uniqueEvents = new Map();
    downtimeEvents.forEach(event => {
      const signature = `${event.server_id}-${event.start_time}-${event.end_time || 'ongoing'}`;
      if (!uniqueEvents.has(signature)) {
        uniqueEvents.set(signature, event);
      }
    });
    
    // 处理每个唯一事件
    Array.from(uniqueEvents.values()).forEach(event => {
      const startDate = new Date(event.start_time);
      const endDate = event.end_time ? new Date(event.end_time) : new Date();
      
      // 按天计算停机时间（可能跨多天）
      let currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);
      
      while (currentDate <= endDate) {
        const dateKey = formatDate(currentDate);
        
        if (dataMap.has(dateKey)) {
          const dayData = dataMap.get(dateKey);
          
          // 计算该事件在当天的持续时间
          const dayStart = new Date(currentDate);
          const dayEnd = new Date(currentDate);
          dayEnd.setHours(23, 59, 59, 999);
          
          const effectiveStart = startDate > dayStart ? startDate : dayStart;
          const effectiveEnd = endDate < dayEnd ? endDate : dayEnd;
          
          if (effectiveStart < effectiveEnd) {
            const dayDuration = Math.floor((effectiveEnd - effectiveStart) / (1000 * 60));
            dayData.count += dayDuration;
            
            // 根据停机时间计算level (0-4)
            const percentage = Math.min(dayData.count / 1440, 1); // 1440分钟 = 24小时
            if (percentage === 0) {
              dayData.level = 0;
            } else if (percentage < 0.1) { // 少于2.4小时
              dayData.level = 1;
            } else if (percentage < 0.25) { // 少于6小时
              dayData.level = 2;
            } else if (percentage < 0.5) { // 少于12小时
              dayData.level = 3;
            } else { // 12小时以上
              dayData.level = 4;
            }
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    // 为所有日期添加tooltip信息和最终的level计算
    const result = Array.from(dataMap.values()).map(dayData => {
      // 确保level计算正确
      const percentage = Math.min(dayData.count / 1440, 1);
      if (percentage === 0) {
        dayData.level = 0;
      } else if (percentage < 0.1) {
        dayData.level = 1;
      } else if (percentage < 0.25) {
        dayData.level = 2;
      } else if (percentage < 0.5) {
        dayData.level = 3;
      } else {
        dayData.level = 4;
      }
      
      const hours = Math.floor(dayData.count / 60);
      const minutes = dayData.count % 60;
      const durationText = dayData.count === 0 
        ? '运行正常'
        : hours > 0 
          ? `停机 ${hours}小时${minutes}分钟`
          : `停机 ${minutes}分钟`;
      
      const tooltipDate = new Date(dayData.date);
      const dateStr = tooltipDate.toLocaleDateString('zh-CN', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      });
      
      return {
        ...dayData,
        title: `${dateStr} - ${durationText}`
      };
    });
    
    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [downtimeEvents]);

  // 计算统计数据
  const stats = useMemo(() => {
    const totalHours = Math.round(downtimeEvents.reduce((acc, event) => {
      const start = new Date(event.start_time);
      const end = event.end_time ? new Date(event.end_time) : new Date();
      return acc + (end - start) / (1000 * 60 * 60);
    }, 0));
    
    const currentOffline = downtimeEvents.filter(e => !e.end_time).length;
    
    return { totalHours, currentOffline };
  }, [downtimeEvents]);

  // 自定义主题 - 绿色到红色渐变（绿色=正常，红色=停机多）
  const theme = {
    light: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'],
    dark: ['#16a34a', '#65a30d', '#ca8a04', '#ea580c', '#dc2626']
  };

  // 自定义tooltip - 调试并确保正确格式
  const renderTooltip = (activity) => {
    console.log('Tooltip activity:', activity); // 调试日志
    
    if (!activity || !activity.date) {
      return '无数据';
    }
    
    try {
      const date = new Date(activity.date);
      const dateStr = date.toLocaleDateString('zh-CN', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      });
      
      const hours = Math.floor((activity.count || 0) / 60);
      const minutes = (activity.count || 0) % 60;
      const durationText = activity.count === 0 
        ? '运行正常'
        : hours > 0 
          ? `停机 ${hours}小时${minutes}分钟`
          : `停机 ${minutes}分钟`;
      
      return `${dateStr} - ${durationText}`;
    } catch (error) {
      console.error('Tooltip error:', error);
      return '数据错误';
    }
  };

  return (
    <>
      <style>
        {`
          .react-activity-calendar {
            display: block !important;
            margin: 0 auto;
            width: 100% !important;
            max-width: none !important;
          }
          .react-activity-calendar svg {
            width: 100% !important;
            height: auto !important;
          }
          .react-activity-calendar__legend {
            display: flex !important;
            justify-content: center;
            align-items: center;
            margin-top: 8px;
            gap: 6px;
            font-size: 10px;
          }
          .react-activity-calendar__legend-colors {
            display: flex !important;
            gap: 2px;
            padding: 3px 6px;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 4px;
          }
          .react-activity-calendar text {
            fill: currentColor !important;
            font-size: 11px !important;
            font-weight: 500;
          }
          .react-activity-calendar .react-activity-calendar__months text {
            font-size: 10px !important;
          }
          .react-activity-calendar .react-activity-calendar__days text {
            font-size: 10px !important;
          }
          .react-activity-calendar rect {
            rx: 2;
            ry: 2;
            cursor: pointer;
          }
          .react-activity-calendar rect:hover {
            stroke: #374151;
            stroke-width: 1;
          }
          .dark .react-activity-calendar__legend-colors {
            background: rgba(255, 255, 255, 0.1);
          }
          .dark .react-activity-calendar rect:hover {
            stroke: #d1d5db;
            stroke-width: 1;
          }
        `}
      </style>
      <div className={`bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
        {/* 紧凑头部 */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white">
            停机热力图
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            过去90天 · {downtimeEvents.length}个事件 · {stats.totalHours}h总时长
          </p>
        </div>
        
        {/* 仅在有离线服务器时显示警告 */}
        {stats.currentOffline > 0 && (
          <div className="text-right">
            <div className="inline-flex items-center px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-md">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></div>
              {stats.currentOffline}台离线
            </div>
          </div>
        )}
      </div>

      {/* 热力图主体区域 - 最大化利用空间 */}
      <div className="flex-1 flex items-center justify-center px-2">
        <div className="w-full">
          <ActivityCalendar
            data={calendarData}
            theme={theme}
            blockSize={14}
            blockMargin={3}
            fontSize={11}
            hideColorLegend={false}
            hideMonthLabels={false}
            hideTotalCount={true}
            loading={false}
            labels={{
              months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
              weekdays: ['日', '一', '二', '三', '四', '五', '六'],
              totalCount: '{{count}} 个事件',
              legend: {
                less: '较少',
                more: '较多'
              }
            }}
            style={{
              fontFamily: 'inherit',
              fontSize: '11px',
              color: 'rgb(107 114 128)',
              width: '100%'
            }}
          />
        </div>
        </div>
      </div>
    </>
  );
};

export default CompactHeatmap;