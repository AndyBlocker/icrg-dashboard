#!/bin/bash

# 配置文件
LOG_FILE="$HOME/autostart.log"
STATUS_SCRIPT="$HOME/status/status.py"                    # 状态监控脚本路径
CLASH_BINARY="$HOME/Clash/clash"                   # Clash可执行文件路径

# 记录日志
log() {
    echo "$(date): $1" >> $LOG_FILE
}

reset_log() {
    echo "======================================" > $LOG_FILE
    echo "自动启动脚本执行 - $(date)" >> $LOG_FILE
    echo "======================================" >> $LOG_FILE
}

# 检查screen会话是否存在
check_screen_exists() {
    screen -ls | grep -q "$1"
    return $?
}

# 检查进程是否在运行
check_process_running() {
    pgrep -f "$1" > /dev/null
    return $?
}

# 启动Clash
start_clash() {
    if ! check_screen_exists "clash"; then
        log "启动新的Clash代理服务会话..."
        screen -dmS clash $CLASH_BINARY
        log "Clash启动命令已执行"
        
        # 等待Clash启动
        log "等待10秒确保Clash启动完成..."
        sleep 10
    else
        # 检查Clash进程是否在运行
        if ! check_process_running "$CLASH_BINARY"; then
            log "Clash会话存在但进程未运行，重启Clash..."
            screen -S clash -X quit
            sleep 2
            screen -dmS clash $CLASH_BINARY
            log "Clash已重新启动"
            sleep 10
        else
            log "Clash已在运行中，无需重启"
        fi
    fi
}

# 启动状态监控脚本
start_status() {
    if ! check_screen_exists "status"; then
        log "启动新的状态监控脚本会话..."
        # 使用Clash代理启动status.py
        screen -dmS status bash -c "python $STATUS_SCRIPT"
        log "状态监控脚本启动命令已执行"
    else
        # 检查状态监控脚本是否在运行
        if ! check_process_running "python.*$STATUS_SCRIPT"; then
            log "状态监控会话存在但脚本未运行，重启状态监控脚本..."
            screen -S status -X quit
            sleep 2
            screen -dmS status bash -c "python $STATUS_SCRIPT"
            log "状态监控脚本已重新启动"
        else
            log "状态监控脚本已在运行中，无需重启"
        fi
    fi
}

# 主函数
main() {

    reset_log
    
    log "========== 自动启动脚本开始执行 =========="
    log "========== 开始自动启动检查 =========="
    
    # 首先启动Clash代理
    start_clash
    
    # 然后启动状态监控脚本
    start_status
    
    log "========== 自动启动检查完成 =========="
}

# 执行主函数
main