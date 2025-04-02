#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import time
import psutil
import subprocess
from collections import defaultdict

# SERVER_URL = 
INTERVAL = 1 

# 你可以在这里写死，也可以用环境变量
MACHINE_NAME = "Lithium"
MACHINE_ALIAS = "单卡4090服务器"
SERVER_TYPE = "GPU"   # 或者 "CPU"

def get_system_status():
    cpu_usage = psutil.cpu_percent(interval=1)
    memory_info = psutil.virtual_memory()
    memory_usage = memory_info.percent
    memory_total = memory_info.total // (1024 ** 2)  # 转换为MB
    memory_used = memory_info.used // (1024 ** 2)    # 转换为MB

    gpu_info = get_gpu_info()
    top_processes = get_top_processes()

    status = {
        "Machine Name": MACHINE_NAME,
        "Machine Alias": MACHINE_ALIAS,
        "Server Type": SERVER_TYPE,
        "CPU Usage (%)": cpu_usage,
        "Memory Usage (%)": memory_usage,
        "Total Memory (MB)": memory_total,
        "Used Memory (MB)": memory_used,
        "GPU Information": gpu_info,
        "Top Processes": top_processes,
    }

    return status

def get_gpu_info():
    if SERVER_TYPE.lower() != "gpu":
        return "No GPU Info - This is a CPU server."
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,utilization.gpu,memory.used,memory.total", "--format=csv,noheader,nounits"],
            capture_output=True, text=True)
        if result.returncode != 0 or not result.stdout.strip():
            return "No GPU Info Available"

        gpu_lines = result.stdout.strip().split('\n')
        gpu_info_list = []
        for line in gpu_lines:
            name, utilization, mem_used, mem_total = line.split(',')
            gpu_info_list.append(f"Name: {name.strip()}, Utilization: {utilization.strip()}%, Used Memory: {mem_used.strip()} MB, Total Memory: {mem_total.strip()} MB")
        return "\n".join(gpu_info_list)
    except Exception as e:
        return f"No GPU Info Available (Error: {str(e)})"

def get_top_processes():
    if SERVER_TYPE.lower() == "gpu":
        # GPU 服务器上，通过 nvidia-smi 获取
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-compute-apps=pid,used_memory,gpu_uuid", "--format=csv,noheader,nounits"],
                capture_output=True, text=True)
            if result.returncode != 0:
                return "No Process Info Available"

            lines = result.stdout.strip().split('\n')
            process_dict = defaultdict(lambda: {"used_memory": 0, "gpus": set(), "process_name": "", "user": "", "full_cmd": ""})

            for line in lines:
                if not line.strip():
                    continue
                pid_str, used_mem_str, gpu_uuid_str = line.split(',')
                pid = int(pid_str.strip())
                used_memory = int(used_mem_str.strip())
                gpu_uuid = gpu_uuid_str.strip()

                # 获取用户名
                try:
                    username = psutil.Process(pid).username()
                except:
                    username = "Unknown"

                # 获取命令行
                try:
                    with open(f'/proc/{pid}/cmdline', 'r') as cmd_file:
                        cmdline = cmd_file.read().replace('\0', ' ').strip()
                        full_cmd = cmdline
                        simple_cmd = ' '.join(cmdline.split()[:2])
                except:
                    full_cmd = "Unknown Command"
                    simple_cmd = "Unknown Command"

                process_dict[pid]["used_memory"] += used_memory
                process_dict[pid]["gpus"].add(gpu_uuid)
                process_dict[pid]["user"] = username
                process_dict[pid]["process_name"] = simple_cmd
                process_dict[pid]["full_cmd"] = full_cmd

            processes = []
            for pid, info in process_dict.items():
                if info["used_memory"] > 100:  # 只选取显存占用大于100MB的进程
                    processes.append(
                        f"PID: {pid}, Process Name: {info['process_name']}, User: {info['user']}, Used Memory: {info['used_memory']} MB, GPUs: {', '.join(info['gpus'])}"
                    )
            # 只返回前5个进程
            return "\n".join(processes[:5]) if processes else "No Process Exceeding 100MB"
        except:
            return "No Process Info Available"

    else:
        # CPU 服务器上，通过 psutil 获取
        try:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'username', 'memory_info']):
                mem_used = proc.info['memory_info'].rss // (1024 ** 2)  # MB
                if mem_used > 100:
                    processes.append(
                        f"PID: {proc.info['pid']}, Name: {proc.info['name']}, User: {proc.info['username']}, Used: {mem_used} MB"
                    )
            return "\n".join(processes[:5]) if processes else "No Process Exceeding 100MB"
        except:
            return "No Process Info Available"

def main():
    while True:
        data = get_system_status()
        try:
            resp = requests.post(SERVER_URL, json=data, timeout=5)
            # 可根据需要打印resp.status_code等调试信息
            print(f"Sent Status to Server. Response: {resp.status_code}")
        except Exception as e:
            # 网络异常或服务器异常时，可做简单重试/打印日志
            print(f"Failed to Send Status to Server. Error: {str(e)}")
            pass
        time.sleep(INTERVAL)

if __name__ == "__main__":
    main()
