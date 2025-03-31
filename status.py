import os
import subprocess
import json
import psutil
import requests
import time
from collections import defaultdict

# 飞书API URL
SEARCH_API_URL = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{APP_TOKEN}/tables/{TABLE_ID}/records/search?page_size=500"
# UPDATE_API_URL_TEMPLATE = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{APP_TOKEN}/tables/{TABLE_ID}/records/{{record_id}}"
CREATE_API_URL = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{APP_TOKEN}/tables/{TABLE_ID}/records"
TOKEN_API_URL = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"

# 机器信息
MACHINE_NAME = "Tester"
MACHINE_ALIAS = "可能是4090服务器"
SERVER_TYPE = "GPU"  # "GPU" 或 "CPU"

def get_tenant_access_token():
    """
    获取 tenant_access_token
    """
    payload = {
        "app_id": APP_ID,
        "app_secret": APP_SECRET
    }
    
    headers = {
        "Content-Type": "application/json; charset=utf-8"
    }
    
    response = requests.post(TOKEN_API_URL, headers=headers, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        if data["code"] == 0:
            return data["tenant_access_token"]
        else:
            print(f"获取token失败，错误信息: {data['msg']}")
            return None
    else:
        print(f"请求token失败，状态码: {response.status_code}")
        return None

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
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,utilization.gpu,memory.used,memory.total", "--format=csv,noheader,nounits"],
            capture_output=True, text=True)
        gpu_info = []
        for line in result.stdout.strip().split('\n'):
            name, utilization, mem_used, mem_total = line.split(',')
            gpu_info.append(f"Name: {name.strip()}, Utilization: {utilization.strip()}%, Used Memory: {mem_used.strip()} MB, Total Memory: {mem_total.strip()} MB")
        return "\n".join(gpu_info)
    except Exception as e:
        return "No GPU Info Available"

def get_top_processes():
    processes = []
    if SERVER_TYPE == "GPU":
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-compute-apps=pid,used_memory,gpu_uuid", "--format=csv,noheader,nounits"],
                capture_output=True, text=True)
            process_dict = defaultdict(lambda: {"used_memory": 0, "gpus": set(), "process_name": "", "user": "", "full_cmd": ""})
            
            for line in result.stdout.strip().split('\n'):
                pid, used_memory, gpu_uuid = line.split(',')
                pid = int(pid.strip())
                used_memory = int(used_memory.strip())

                # 获取用户名
                try:
                    username = psutil.Process(pid).username()
                except Exception:
                    username = "Unknown"

                # 获取命令行
                try:
                    with open(f'/proc/{pid}/cmdline', 'r') as cmd_file:
                        cmdline = cmd_file.read().replace('\0', ' ').strip()
                        full_cmd = cmdline  # 保留完整命令
                        # 提取基本命令和脚本名称
                        simple_cmd = ' '.join(cmdline.split()[:2])
                except Exception:
                    full_cmd = "Unknown Command"
                    simple_cmd = "Unknown Command"

                # 记录进程信息
                process_dict[pid]["used_memory"] += used_memory
                process_dict[pid]["gpus"].add(gpu_uuid.strip())
                process_dict[pid]["user"] = username
                process_dict[pid]["process_name"] = simple_cmd  # 简化的命令行
                process_dict[pid]["full_cmd"] = full_cmd  # 完整的命令行

            # 将汇总后的进程信息添加到列表中
            for pid, info in process_dict.items():
                if info["used_memory"] > 100:  # 只选取显存占用大于100MB的进程
                    processes.append(f"PID: {pid}, Process Name: {info['process_name']}, User: {info['user']}, Used Memory: {info['used_memory']} MB, GPUs: {', '.join(info['gpus'])}")
            
            return "\n".join(processes[:5])  # 只返回前5个进程
        except Exception as e:
            return "No Process Info Available"
    elif SERVER_TYPE == "CPU":
        try:
            for proc in psutil.process_iter(['pid', 'name', 'username', 'memory_info']):
                mem_used = proc.info['memory_info'].rss // (1024 ** 2)  # 转换为MB
                if mem_used > 100:
                    try:
                        with open(f'/proc/{proc.info["pid"]}/cmdline', 'r') as cmd_file:
                            full_cmd = cmd_file.read().replace('\0', ' ').strip()
                    except Exception:
                        full_cmd = proc.info['name']  # 如果读取 cmdline 失败，使用进程名称代替

                    processes.append(f"PID: {proc.info['pid']}, Process Name: {proc.info['name']}, User: {proc.info['username']}, Used Memory: {mem_used} MB")
            return "\n".join(processes[:5])
        except Exception as e:
            return "No Process Info Available"

def query_record(tenant_access_token, machine_name):
    headers = {
        "Authorization": f"Bearer {tenant_access_token}",
        "Content-Type": "application/json; charset=utf-8"
    }

    payload = {
        "field_names": ["Machine Name"]
    }

    response = requests.post(SEARCH_API_URL, headers=headers, json=payload)

    if response.status_code == 200:
        data = response.json()
        # print(data)
        records = data.get("data", {}).get("items", [])
        if records:
            return records[0]["record_id"]  # 假设Machine Name唯一
        else:
            return None
    else:
        print(f"查询失败，状态码: {response.status_code}, 错误信息: {response.text}")
        return None

def update_record(tenant_access_token, record_id, status):
    headers = {
        "Authorization": f"Bearer {tenant_access_token}",
        "Content-Type": "application/json; charset=utf-8"
    }

    url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{APP_TOKEN}/tables/{TABLE_ID}/records/{record_id}"

    payload = {
        "fields": {
            "Machine Name": status["Machine Name"],
            "Machine Alias": status["Machine Alias"],
            "Server Type": status["Server Type"],
            "CPU Usage (%)": status["CPU Usage (%)"],
            "Memory Usage (%)": status["Memory Usage (%)"],
            "Total Memory (MB)": status["Total Memory (MB)"],
            "Used Memory (MB)": status["Used Memory (MB)"],
            "GPU Information": status["GPU Information"],
            "Top Processes": status["Top Processes"]
        }
    }

    response = requests.put(url, headers=headers, json=payload)

    if response.status_code == 200:
        print("记录更新成功")
    else:
        print(f"更新失败，状态码: {response.status_code}, 错误信息: {response.text}")


def create_record(tenant_access_token, status):
    headers = {
        "Authorization": f"Bearer {tenant_access_token}",
        "Content-Type": "application/json; charset=utf-8"
    }

    payload = {
        "fields": {
            "Machine Name": status["Machine Name"],
            "Machine Alias": status["Machine Alias"],
            "Server Type": status["Server Type"],
            "CPU Usage (%)": status["CPU Usage (%)"],
            "Memory Usage (%)": status["Memory Usage (%)"],
            "Total Memory (MB)": status["Total Memory (MB)"],
            "Used Memory (MB)": status["Used Memory (MB)"],
            "GPU Information": status["GPU Information"],
            "Top Processes": status["Top Processes"]
        }
    }

    response = requests.post(CREATE_API_URL, headers=headers, json=payload)

    if response.status_code == 200:
        print("记录创建成功")
    else:
        print(f"创建失败，状态码: {response.status_code}, 错误信息: {response.text}")

def send_status_to_bitable(status):
    tenant_access_token = get_tenant_access_token()
    if not tenant_access_token:
        print("无法获取 tenant_access_token，跳过本次操作")
        return

    record_id = query_record(tenant_access_token, status["Machine Name"])
    if record_id:
        print(f"找到记录ID: {record_id}，准备更新记录")
        update_record(tenant_access_token, record_id, status)
    else:
        print("未找到对应记录，准备创建新记录")
        create_record(tenant_access_token, status)

def main():
    while True:
        status = get_system_status()
        send_status_to_bitable(status)
        time.sleep(5)  # 每隔5秒上传一次数据

if __name__ == "__main__":
    main()
