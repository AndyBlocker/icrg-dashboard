# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

这是一个完整的 ICRG 服务器监控仪表板系统，包含实时状态显示、历史数据分析、停机事件跟踪和 90 天停机热力图可视化。

## 命令

### 前端开发环境
- `npm run dev` - 启动开发服务器，端口 3000/3001，支持热重载
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建
- `npm run lint` - 运行 ESLint 进行代码质量检查
- `npm run deploy` - 构建并准备部署（复制资源文件）

### 后端服务 (Python Flask)
- `python status/server.py init_db` - 初始化数据库表
- `python status/server.py run_server` - 启动 Flask 服务器，端口 5000
- `python status/status.py` - 运行客户端监控脚本

## 技术架构

### 前端技术栈
- **框架**: React 18 + Vite (快速构建工具)
- **UI 框架**: Tailwind CSS + DaisyUI 组件库
- **路由**: React Router v6，基础路径 `/icrg_status`
- **HTTP 客户端**: Axios，API 基础 URL `https://api.mer.dev`
- **状态管理**: React Hooks (useState, useEffect, useMemo, useCallback)
- **图表库**: Chart.js + react-chartjs-2
- **热力图**: react-activity-calendar (GitHub 风格贡献图)
- **时间处理**: date-fns (支持中文本地化)

### 后端技术栈
- **Web 框架**: Flask (Python)
- **数据库**: SQLite + SQLAlchemy ORM (生产环境可配置为 MySQL/PostgreSQL)
- **任务调度**: APScheduler (定时数据聚合和宕机检测)
- **系统监控**: psutil + nvidia-smi (GPU 监控)
- **时区处理**: 中国时区 (UTC+8)

### 核心功能

#### 1. 实时监控仪表板
- **服务器卡片**: CPU/内存/GPU 使用率实时显示，70px 圆形仪表盘
- **状态指示**: 在线/离线状态，最后更新时间显示
- **响应式设计**: 移动端友好，自适应网格布局

#### 2. 停机事件管理
- **事件卡片**: 2 列紧凑布局显示开始时间、持续时间、状态
- **智能时间格式**: "今天 14:30"、"昨天 10:00"、"M/d HH:mm" 格式
- **实时状态**: 进行中的停机事件带有动画脉冲效果

#### 3. 停机热力图
- **90 天可视化**: GitHub 风格的贡献图，显示每日停机时长
- **颜色编码**: 绿色(无停机) → 黄色 → 橙色 → 红色(24小时停机)
- **交互式 Tooltip**: 显示具体日期和停机时长信息
- **月份和星期标签**: 中文本地化显示

#### 4. 主页布局 (2×3 网格)
- **固定布局**: 热力图占据第一列 (2 行)，4 个最新停机事件占据其余位置
- **自适应**: 桌面端固定网格，移动端垂直堆叠
- **占位符**: 事件不足时显示优雅的占位符

### API 端点
- `POST /icrg_status/receive` - 接收客户端监控数据
- `GET /icrg_status/current` - 获取所有服务器当前状态
- `GET /icrg_status/history` - 获取历史聚合数据  
- `GET /icrg_status/downtime` - 获取停机事件列表
- `GET /icrg_status/user_stats?username=X&days=Y` - 用户资源使用统计

### 数据流架构
1. **数据采集**: 客户端脚本每秒收集系统指标（CPU、内存、GPU、进程）
2. **数据传输**: 通过 HTTP POST 发送到 Flask 服务器
3. **实时存储**: 原始数据存储在 `usage_raw` 表（保留 6 小时）
4. **数据聚合**: 每小时生成聚合数据存储在 `usage_history` 表（保留 90 天）
5. **前端展示**: 实时仪表板每秒刷新，历史数据按需加载

### 核心 React 组件

#### 页面组件
- **Home.jsx**: 主仪表板，包含服务器网格、停机事件和热力图
- **Downtime.jsx**: 停机历史页面，支持筛选和分页

#### 功能组件
- **ServerCard.jsx**: 服务器状态卡片，显示 CPU/内存/GPU 仪表盘
- **ServerDetails.jsx**: 服务器详情模态框，包含历史图表
- **DowntimeEvent.jsx**: 停机事件卡片，2 列布局
- **CompactHeatmap.jsx**: 90 天停机热力图，基于 react-activity-calendar
- **Gauge.jsx**: 圆形进度指示器组件
- **Layout.jsx**: 应用布局包装器，包含导航和深色模式

#### 工具函数 (utils/index.js)
- **formatCompactDateTime**: 智能时间格式化 ("今天 14:30", "M/d HH:mm")
- **formatDuration**: 停机时长格式化 ("2小时30分钟")
- **getUtilizationColor**: 根据使用率返回对应颜色类
- **processActiveUsers**: 处理活跃用户数据

### 数据库模式
- **servers**: 服务器注册表，存储机器名、别名、心跳状态
- **usage_raw**: 实时监控数据，包含 CPU、内存、GPU、进程信息
- **usage_history**: 每小时聚合数据，包含用户使用统计
- **downtime_events**: 停机事件记录，包含开始/结束时间

### 响应式设计
- **移动端优化**: 卡片垂直堆叠，触摸友好的 44px 最小点击区域
- **平板适配**: 2 列网格布局
- **桌面端**: 多列网格，固定 2×3 布局用于主页
- **深色模式**: 完整的深色主题支持，自动适配系统偏好

### 开发工具配置
- **ESLint**: 代码质量检查
- **Vite**: 快速开发服务器和构建工具  
- **PostCSS**: CSS 处理器，支持 Tailwind
- **Proxy**: 开发时将 `/api` 请求代理到生产 API

### 部署注意事项
- 构建输出目录: `./dist/`
- 静态资源路径: 相对路径，支持子目录部署
- 生产 API: `https://api.mer.dev`
- 客户端路由: 需要服务器支持 HTML5 History API