// UI 常量
export const COLORS = {
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  status: {
    online: '#10b981',
    offline: '#ef4444',
    warning: '#f59e0b',
    unknown: '#6b7280',
  }
};

// 尺寸常量
export const SIZES = {
  gauge: {
    small: 60,
    medium: 80,
    large: 120,
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  }
};

// 性能阈值
export const THRESHOLDS = {
  cpu: {
    warning: 70,
    danger: 90,
  },
  memory: {
    warning: 80,
    danger: 95,
  },
  gpu: {
    warning: 75,
    danger: 90,
  }
};

// 时间常量
export const TIME = {
  refreshInterval: 1000, // 1秒
  offlineThreshold: 300000, // 5分钟
  animationDuration: 200, // 动画持续时间
};

// 服务器类型
export const SERVER_TYPES = {
  GPU: 'GPU',
  CPU: 'CPU',
};

// 状态类型
export const STATUS_TYPES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  WARNING: 'warning',
  UNKNOWN: 'unknown',
};

// 样式类名常量
export const STYLES = {
  card: {
    base: 'bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200',
    hover: 'hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600',
    selected: 'ring-2 ring-primary-500 border-primary-500',
  },
  button: {
    primary: 'px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200',
    secondary: 'px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors duration-200',
  },
  text: {
    title: 'text-2xl font-bold text-gray-800 dark:text-white',
    subtitle: 'text-lg font-semibold text-gray-700 dark:text-gray-300',
    body: 'text-gray-600 dark:text-gray-400',
    caption: 'text-sm text-gray-500 dark:text-gray-500',
  }
};

// 图表配置
export const CHART_CONFIG = {
  defaultOptions: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
        }
      },
      x: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgb(107, 114, 128)',
        }
      }
    }
  }
};