#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import time
from datetime import datetime, timedelta, timezone
import json
import os
from contextlib import contextmanager

from flask import Flask, request, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.declarative import declarative_base
from collections import defaultdict


# 设置中国时区（UTC+8）
CHINA_TZ = timezone(timedelta(hours=8))

# 获取当前中国时间的函数
def get_china_time():
    return datetime.now(CHINA_TZ).replace(tzinfo=None)

# 这里使用 SQLite 数据库
# 如果要用 MySQL/PostgreSQL，修改此处连接字符串
DATABASE_URL = "sqlite:///icrg_status.db"

Base = declarative_base()

# ==========================
# 1. 数据表模型定义
# ==========================

class Server(Base):
    """
    服务器表，存储各服务器的基本信息、最后一次心跳时间等
    时间使用中国时间（UTC+8）
    """
    __tablename__ = "servers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_name = Column(String(200), unique=True, nullable=False)  # 比如: "ServerA"
    machine_alias = Column(String(200), nullable=True)               # 比如: "GPU服务器1"
    server_type = Column(String(50), nullable=True)                  # "GPU" or "CPU"
    last_heartbeat = Column(DateTime, nullable=True)                 # 最后一次收到数据的时间
    created_at = Column(DateTime, default=get_china_time)
    updated_at = Column(DateTime, default=get_china_time)

class UsageRaw(Base):
    """
    实时数据表（秒级别），记录每次上报的详细数据。
    仅保留近 24 小时（或其他你想要的时间长度）的数据。
    时间使用中国时间（UTC+8）
    """
    __tablename__ = "usage_raw"

    id = Column(Integer, primary_key=True, autoincrement=True)
    server_id = Column(Integer, ForeignKey("servers.id"), nullable=False)
    timestamp = Column(DateTime, default=get_china_time, index=True)  # 数据上报时刻
    cpu_usage = Column(Float, nullable=True)               # CPU占用率
    mem_usage = Column(Float, nullable=True)               # 内存占用率
    mem_total = Column(Integer, nullable=True)             # 总内存(MB)
    mem_used = Column(Integer, nullable=True)              # 已用内存(MB)
    gpu_info = Column(Text, nullable=True)                 # GPU 信息，JSON或字符串
    top_processes = Column(Text, nullable=True)            # 主要进程信息，JSON或字符串

    server = relationship("Server", backref="usage_records")

class UsageHistory(Base):
    """
    历史聚合表（例如，按小时聚合并存储90天）。
    可以存储平均CPU、平均Mem、平均GPU使用率，以及时段内主要的使用者信息等。
    时间使用中国时间（UTC+8）
    """
    __tablename__ = "usage_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    server_id = Column(Integer, ForeignKey("servers.id"), nullable=False)
    period_start = Column(DateTime, nullable=False)  # 聚合开始时间（如某小时起始）
    period_end = Column(DateTime, nullable=False)    # 聚合结束时间（如某小时结束）
    avg_cpu_usage = Column(Float, nullable=True)
    avg_mem_usage = Column(Float, nullable=True)
    avg_gpu_usage = Column(Float, nullable=True)     # 可用时计算GPU平均占用
    details = Column(Text, nullable=True)            # 可能存主要使用者统计等

    server = relationship("Server", backref="history_records")

class DowntimeEvent(Base):
    """
    掉线事件表：服务器从什么时间开始掉线，什么时间结束。
    如果还没恢复，则 end_time 可能为 None。
    时间使用中国时间（UTC+8）
    """
    __tablename__ = "downtime_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    server_id = Column(Integer, ForeignKey("servers.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)  # None 表示尚未恢复

    server = relationship("Server", backref="downtime_events")


# 创建数据库引擎，添加连接池配置
engine = create_engine(
    DATABASE_URL, 
    echo=False, 
    future=True,
    pool_size=20,  # 连接池大小，保持的连接数量
    pool_recycle=3600,  # 连接在池中的生存时间，超过这个时间会被回收重建
    pool_pre_ping=True,  # 在使用连接前检查连接是否有效
    max_overflow=10  # 允许超出pool_size的连接数，用于处理高峰期
)
SessionLocal = sessionmaker(bind=engine)

# 创建数据库会话上下文管理器
@contextmanager
def get_db_session():
    """数据库会话的上下文管理器，确保会话被正确创建和关闭"""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise
    finally:
        session.close()

# ==========================
# 2. Flask 应用
# ==========================
app = Flask(__name__)
CORS(app)  # 如果需要跨域访问，可以开启

@app.route("/icrg_status/receive", methods=["POST"])
def receive_status():
    """
    接收客户端脚本发送的服务器状态信息。
    JSON 示例:
    {
      "Machine Name": "ServerA",
      "Machine Alias": "GPU节点1",
      "Server Type": "GPU",
      "CPU Usage (%)": 30,
      "Memory Usage (%)": 40,
      "Total Memory (MB)": 32000,
      "Used Memory (MB)": 12800,
      "GPU Information": "...",
      "Top Processes": "..."
    }
    """
    data = request.json
    if not data:
        return jsonify({"error": "No data received"}), 400

    machine_name = data.get("Machine Name")
    machine_alias = data.get("Machine Alias")
    server_type = data.get("Server Type")
    cpu_usage = data.get("CPU Usage (%)")
    mem_usage = data.get("Memory Usage (%)")
    mem_total = data.get("Total Memory (MB)")
    mem_used = data.get("Used Memory (MB)")
    gpu_info = data.get("GPU Information")
    top_processes = data.get("Top Processes")

    # 使用会话上下文管理器
    with get_db_session() as db:
        try:
            server_obj = db.query(Server).filter_by(machine_name=machine_name).first()
            if not server_obj:
                server_obj = Server(
                    machine_name=machine_name,
                    machine_alias=machine_alias,
                    server_type=server_type,
                    last_heartbeat=get_china_time()
                )
                db.add(server_obj)
                db.flush()  # 刷新会话获取ID，但不提交
            else:
                # 更新别名、类型等
                if machine_alias:
                    server_obj.machine_alias = machine_alias
                if server_type:
                    server_obj.server_type = server_type
                # 更新心跳时间
                server_obj.last_heartbeat = get_china_time()
                server_obj.updated_at = get_china_time()

            # 写入 usage_raw
            usage = UsageRaw(
                server_id=server_obj.id,
                timestamp=get_china_time(),
                cpu_usage=cpu_usage,
                mem_usage=mem_usage,
                mem_total=mem_total,
                mem_used=mem_used,
                gpu_info=gpu_info,
                top_processes=top_processes
            )
            db.add(usage)
            # 提交将在上下文管理器中自动完成

        except Exception as e:
            # 上下文管理器会自动处理回滚
            return jsonify({"error": str(e)}), 500

    return jsonify({"status": "ok"}), 200

@app.route("/icrg_status/current", methods=["GET"])
def get_current_status():
    with get_db_session() as db:
        try:
            servers = db.query(Server).all()
            result = []
            for s in servers:
                # 找到最新一条 usage_raw
                latest_usage = db.query(UsageRaw) \
                    .filter(UsageRaw.server_id == s.id) \
                    .order_by(UsageRaw.timestamp.desc()) \
                    .first()
                if latest_usage:
                    result.append({
                        "id": s.id,
                        "machine_name": s.machine_name,
                        "machine_alias": s.machine_alias,
                        "server_type": s.server_type,
                        "last_heartbeat": s.last_heartbeat.isoformat() if s.last_heartbeat else None,
                        "cpu_usage": latest_usage.cpu_usage,
                        "mem_usage": latest_usage.mem_usage,
                        "mem_total": latest_usage.mem_total,
                        "mem_used": latest_usage.mem_used,
                        "gpu_info": latest_usage.gpu_info,
                        "top_processes": latest_usage.top_processes,
                    })
                else:
                    # 没有任何上报
                    result.append({
                        "id": s.id,
                        "machine_name": s.machine_name,
                        "machine_alias": s.machine_alias,
                        "server_type": s.server_type,
                        "last_heartbeat": s.last_heartbeat.isoformat() if s.last_heartbeat else None,
                        "cpu_usage": None,
                        "mem_usage": None,
                        "mem_total": None,
                        "mem_used": None,
                        "gpu_info": None,
                        "top_processes": None,
                    })

            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route("/icrg_status/downtime", methods=["GET"])
def get_downtime_events():
    """
    （可选）查看所有服务器的掉线历史事件。
    """
    with get_db_session() as db:
        try:
            events = db.query(DowntimeEvent).all()
            result = []
            for e in events:
                result.append({
                    "server_id": e.server_id,
                    "start_time": e.start_time.isoformat(),
                    "end_time": e.end_time.isoformat() if e.end_time else None
                })
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route("/icrg_status/history", methods=["GET"])
def get_history():
    """
    （可选）查看所有服务器的历史聚合数据（比如最近24小时/最近90天）。
    """
    with get_db_session() as db:
        try:
            records = db.query(UsageHistory).all()
            result = []
            for r in records:
                result.append({
                    "server_id": r.server_id,
                    "period_start": r.period_start.isoformat(),
                    "period_end": r.period_end.isoformat(),
                    "avg_cpu_usage": r.avg_cpu_usage,
                    "avg_mem_usage": r.avg_mem_usage,
                    "avg_gpu_usage": r.avg_gpu_usage,
                    "details": r.details
                })
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# 在Flask应用中添加，在其他路由后
@app.route("/icrg_status/user_stats", methods=["GET"])
def get_user_stats():
    """查询特定用户的资源使用统计"""
    username = request.args.get("username")
    days = int(request.args.get("days", 7))  # 默认查询7天
    
    if not username:
        return jsonify({"error": "Username parameter is required"}), 400
    
    now = get_china_time()
    start_date = now - timedelta(days=days)
    
    with get_db_session() as db:
        try:
            # 查询历史记录
            records = db.query(UsageHistory)\
                .filter(UsageHistory.period_end >= start_date)\
                .order_by(UsageHistory.period_start.asc())\
                .all()
            
            result = []
            for r in records:
                if not r.details:
                    continue
                    
                try:
                    details = json.loads(r.details)
                    # 查找该用户的统计信息
                    for user_stat in details.get("top_users", []):
                        if user_stat["user"] == username:
                            result.append({
                                "server_id": r.server_id,
                                "period_start": r.period_start.isoformat(),
                                "period_end": r.period_end.isoformat(),
                                "avg_mem": user_stat["avg_mem"]
                            })
                            break
                except:
                    pass
                    
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# ==========================
# 3. APScheduler 任务
# ==========================

# 优化APScheduler配置，添加线程安全参数
scheduler = BackgroundScheduler(
    job_defaults={
        'coalesce': True,  # 合并处理错过的执行
        'max_instances': 1  # 防止同一任务的并发执行
    }
)

@scheduler.scheduled_job("interval", minutes=1)
def check_downtime():
    """
    每隔1分钟执行一次，检查是否有服务器超过一定时间未上报(如2分钟)，
    若超过则标记开始掉线；如果正在掉线中又收到数据，则结束掉线。
    """
    OFFLINE_THRESHOLD = 60 * 5  # 300秒未上报则视为掉线
    now = get_china_time()

    with get_db_session() as db:
        try:
            servers = db.query(Server).all()
            for s in servers:
                if not s.last_heartbeat:
                    continue
                delta = now - s.last_heartbeat
                # 检查是否已经掉线
                is_offline = (delta.total_seconds() > OFFLINE_THRESHOLD)
                # 查询当前是否有尚未结束的掉线事件
                open_event = db.query(DowntimeEvent)\
                    .filter(DowntimeEvent.server_id == s.id)\
                    .filter(DowntimeEvent.end_time.is_(None))\
                    .first()
                if is_offline and not open_event:
                    # 新增掉线事件
                    new_event = DowntimeEvent(
                        server_id=s.id,
                        start_time=s.last_heartbeat,
                        end_time=None
                    )
                    db.add(new_event)
                elif not is_offline and open_event:
                    # 服务器重新上线，结束该事件
                    open_event.end_time = now
                # 提交将在上下文管理器中自动完成
        except Exception as e:
            print(f"Error in check_downtime: {e}")
            # 异常将被上下文管理器捕获并自动回滚


@scheduler.scheduled_job("interval", minutes=60)
def aggregate_data():
    """
    每隔1小时执行一次，将 usage_raw 数据聚合到 usage_history，
    并删除过旧的原始数据与历史数据（只留90天）。
    """
    with get_db_session() as db:
        try:
            # 1) 聚合上一个小时的数据（比如 [now - 1h, now)）
            now = get_china_time()
            one_hour_ago = now - timedelta(hours=1)
            # 仅聚合 [one_hour_ago, now) 范围内的数据
            servers = db.query(Server).all()

            for s in servers:
                raw_records = db.query(UsageRaw)\
                    .filter(UsageRaw.server_id == s.id)\
                    .filter(UsageRaw.timestamp >= one_hour_ago)\
                    .filter(UsageRaw.timestamp < now)\
                    .all()
                if not raw_records:
                    continue

                cpu_sum = 0
                mem_sum = 0
                gpu_sum = 0
                count = 0
                gpu_count = 0

                for r in raw_records:
                    if r.cpu_usage is not None:
                        cpu_sum += r.cpu_usage
                    if r.mem_usage is not None:
                        mem_sum += r.mem_usage
                    
                    if r.gpu_info and r.gpu_info != "No GPU Info Available" and "No GPU Info - This is a CPU Server" not in r.gpu_info:
                        try:
                            gpu_lines = r.gpu_info.strip().split("\n")
                            for line in gpu_lines:
                                if "Utilization:" in line:
                                    util_part = line.split("Utilization:")[1].split("%")[0].strip()
                                    gpu_sum += float(util_part)
                                    gpu_count += 1
                        except Exception as e:
                            print(f"Error parsing GPU info: {e}")
        
                    
                    count += 1

                if count > 0:
                    avg_cpu = cpu_sum / count
                    avg_mem = mem_sum / count
                    avg_gpu = gpu_sum / gpu_count if gpu_count > 0 else None

                    # 添加用户资源使用统计
                    user_stats = defaultdict(lambda: {"cpu": 0, "mem": 0, "gpu": 0, "count": 0})

                    for r in raw_records:
                        # 解析top_processes，提取用户名和资源使用
                        if r.top_processes:
                            try:
                                for process_line in r.top_processes.strip().split('\n'):
                                    if "User:" in process_line:
                                        # 提取用户名
                                        user_part = process_line.split("User:")[1].split(",")[0].strip()
                                        # 提取内存使用
                                        if "Used Memory:" in process_line:
                                            mem_part = process_line.split("Used Memory:")[1].split("MB")[0].strip()
                                            user_stats[user_part]["mem"] += float(mem_part)
                                            user_stats[user_part]["count"] += 1
                            except Exception as e:
                                print(f"Error parsing process info: {e}")

                    # 将用户统计添加到details字段
                    top_users = sorted(user_stats.items(), key=lambda x: x[1]["mem"], reverse=True)[:5]
                    details_data = {
                        "top_users": [{"user": user, "avg_mem": stats["mem"]/stats["count"]} 
                                    for user, stats in top_users if stats["count"] > 0]
                    }
                    details = json.dumps(details_data)

                    # 使用详细信息创建历史记录
                    record = UsageHistory(
                        server_id=s.id,
                        period_start=one_hour_ago,
                        period_end=now,
                        avg_cpu_usage=avg_cpu,
                        avg_mem_usage=avg_mem,
                        avg_gpu_usage=avg_gpu,
                        details=details  # 包含用户统计的JSON字符串
                    )
                    db.add(record)

            # 2) 删除超过6小时的原始数据 usage_raw
            expire_time = now - timedelta(hours=6)
            db.query(UsageRaw).filter(UsageRaw.timestamp < expire_time).delete()

            # 3) 删除超过90天的聚合数据 usage_history
            expire_history_time = now - timedelta(days=90)
            db.query(UsageHistory).filter(UsageHistory.period_end < expire_history_time).delete()
            
            # 提交将在上下文管理器中自动完成
        except Exception as e:
            print(f"Error in aggregate_data: {e}")
            # 异常将被上下文管理器捕获并自动回滚


# ==========================
# 4. 主函数：init_db + run_server
# ==========================

def init_db():
    """初始化或升级数据库结构"""
    # 如果不存在表则创建，已存在表默认不再删除。可根据实际需要做 migrate 或者先 drop 再 create
    Base.metadata.create_all(engine)
    print("Database initialized.")

def run_server():
    """启动Flask服务+APScheduler"""
    # 启动定时任务
    scheduler.start()
    # 启动Flask服务(开发环境可直接用app.run, 生产环境推荐使用 gunicorn等)
    app.run(host="0.0.0.0", port=5000, debug=False)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法：python icrg_status_server.py [init_db|run_server]")
        sys.exit(1)

    command = sys.argv[1]
    if command == "init_db":
        init_db()
    elif command == "run_server":
        run_server()
    else:
        print("未知命令：", command)
        sys.exit(1)