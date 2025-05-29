import React, { useMemo } from 'react';
import { formatDate } from '../utils';

const DowntimeHeatmap = ({ downtimeEvents, className = '' }) => {
  // 生成过去90天的网格数据（按周排列）
  const { weeks, dateData } = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today);
    
    // 计算开始日期（90天前）
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 89);
    
    // 找到开始日期所在周的周日
    const firstSunday = new Date(startDate);
    firstSunday.setDate(startDate.getDate() - startDate.getDay());
    
    // 生成周数组
    const weeks = [];
    const dateMap = new Map();
    
    let currentWeekStart = new Date(firstSunday);
    
    while (currentWeekStart <= endDate) {
      const week = [];
      
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + dayOfWeek);
        
        const dateKey = formatDate(date);
        const isInRange = date >= startDate && date <= endDate;
        
        week.push({
          date,
          dateKey,
          isInRange,
          dayOfWeek
        });
        
        // 初始化日期数据
        if (isInRange) {
          dateMap.set(dateKey, { count: 0, totalDuration: 0, events: [] });
        }
      }
      
      weeks.push(week);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return { weeks, dateData: dateMap };
  }, []);

  // 统计停机事件数据
  const downtimeByDate = useMemo(() => {
    // 复制初始数据
    const result = new Map(dateData);
    
    // 统计每日停机事件
    downtimeEvents.forEach(event => {
      const startDate = new Date(event.start_time);
      const endDate = event.end_time ? new Date(event.end_time) : new Date();
      
      // 按天拆分停机事件
      let currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);
      
      while (currentDate <= endDate) {
        const dateKey = formatDate(currentDate);
        
        if (result.has(dateKey)) {
          const dayData = result.get(dateKey);
          
          // 计算当天的停机时长
          const dayStart = new Date(currentDate);
          const dayEnd = new Date(currentDate);
          dayEnd.setHours(23, 59, 59, 999);
          
          const effectiveStart = startDate > dayStart ? startDate : dayStart;
          const effectiveEnd = endDate < dayEnd ? endDate : dayEnd;
          
          if (effectiveStart < effectiveEnd) {
            const dayDuration = Math.floor((effectiveEnd - effectiveStart) / (1000 * 60));
            dayData.totalDuration += dayDuration;
            
            // 只在事件开始日期计数，避免重复计数
            if (formatDate(startDate) === dateKey) {
              dayData.count += 1;
            }
            
            dayData.events.push({
              ...event,
              dayDuration
            });
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    return result;
  }, [downtimeEvents, dateData]);

  // 获取热力图颜色
  const getHeatmapColor = (totalDuration, isInRange) => {
    if (!isInRange) {
      return 'bg-transparent border-transparent';
    }
    
    if (totalDuration === 0) {
      return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    } else if (totalDuration < 60) { // 少于1小时
      return 'bg-green-200 dark:bg-green-900/40 border-green-300 dark:border-green-700';
    } else if (totalDuration < 240) { // 1-4小时
      return 'bg-yellow-300 dark:bg-yellow-900/50 border-yellow-400 dark:border-yellow-600';
    } else if (totalDuration < 480) { // 4-8小时
      return 'bg-orange-400 dark:bg-orange-900/60 border-orange-500 dark:border-orange-600';
    } else { // 超过8小时
      return 'bg-red-500 dark:bg-red-900/70 border-red-600 dark:border-red-500';
    }
  };

  // 获取工具提示文本
  const getTooltipText = (date, data, isInRange) => {
    if (!isInRange) return '';
    
    const dateStr = formatDate(date);
    if (!data || data.count === 0) {
      return `${dateStr}: 无停机事件`;
    }
    
    const hours = Math.floor(data.totalDuration / 60);
    const minutes = data.totalDuration % 60;
    const durationText = hours > 0 
      ? `${hours}小时${minutes}分钟` 
      : `${minutes}分钟`;
    
    return `${dateStr}: ${data.count}个事件, 总时长${durationText}`;
  };

  // 获取月份标签
  const monthLabels = useMemo(() => {
    const labels = [];
    let currentMonth = null;
    
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0].date;
      const month = firstDayOfWeek.getMonth();
      
      if (month !== currentMonth && week.some(day => day.isInRange)) {
        currentMonth = month;
        labels.push({
          weekIndex,
          label: firstDayOfWeek.toLocaleDateString('zh-CN', { month: 'short' })
        });
      }
    });
    
    return labels;
  }, [weeks]);

  // 周几标签
  const weekDayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const visibleWeekDayLabels = ['周一', '周三', '周五'];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              停机事件热力图
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              过去90天的服务器停机情况统计，颜色越深表示停机时间越长
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {downtimeEvents.length} 个事件
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              90天统计
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          {/* 月份标签 */}
          <div className="flex mb-3 relative h-5" style={{ marginLeft: '48px' }}>
            {monthLabels.map(({ weekIndex, label }) => (
              <div
                key={`month-${weekIndex}`}
                className="absolute text-sm font-medium text-gray-700 dark:text-gray-300"
                style={{ left: `${weekIndex * 20}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* 热力图网格 */}
          <div className="flex">
            {/* 周几标签列 */}
            <div className="flex flex-col space-y-1.5 mr-3">
              <div className="h-4"></div> {/* 占位符，对齐第一行 */}
              {weekDayLabels.map((dayLabel, dayIndex) => (
                <div key={dayIndex} className="h-4 flex items-center">
                  <div className="w-10 text-sm text-gray-600 dark:text-gray-400 text-right pr-3 font-medium">
                    {visibleWeekDayLabels.includes(dayLabel) ? dayLabel : ''}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 日期方块网格 */}
            <div className="flex space-x-1.5">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col space-y-1.5">
                  {week.map((day, dayIndex) => {
                    const data = downtimeByDate.get(day.dateKey);
                    
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-4 h-4 rounded border-2 transition-all duration-300 hover:scale-125 hover:shadow-lg ${
                          day.isInRange ? 'cursor-help' : ''
                        } ${getHeatmapColor(data?.totalDuration || 0, day.isInRange)}`}
                        title={getTooltipText(day.date, data, day.isInRange)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 图例和统计 */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">停机频率:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">较少</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700"></div>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-200 dark:bg-green-900/40 border-2 border-green-300 dark:border-green-700"></div>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-yellow-300 dark:bg-yellow-900/50 border-2 border-yellow-400 dark:border-yellow-600"></div>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-orange-400 dark:bg-orange-900/60 border-2 border-orange-500 dark:border-orange-600"></div>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-500 dark:bg-red-900/70 border-2 border-red-600 dark:border-red-500"></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">较多</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 sm:space-x-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(downtimeEvents.reduce((acc, event) => {
                      const start = new Date(event.start_time);
                      const end = event.end_time ? new Date(event.end_time) : new Date();
                      return acc + (end - start) / (1000 * 60 * 60);
                    }, 0))}h
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">总停机时长</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {downtimeEvents.filter(e => !e.end_time).length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">当前离线</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DowntimeHeatmap;