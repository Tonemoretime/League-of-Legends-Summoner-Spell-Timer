@echo off
chcp 65001 > nul
title 一键喊话启动器
echo  一键喊话功能基于Python的模拟键盘功能   暂不清楚是否有封号风险，启动请输入233:
set /p input=

if "%input%"=="233" (
    echo 正在启动一键喊话...
    start send.exe
    echo 等待启动...
    timeout /t 3 /nobreak > nul
    echo.
    echo 启动完成！
    timeout /t 3 /nobreak > nul
)