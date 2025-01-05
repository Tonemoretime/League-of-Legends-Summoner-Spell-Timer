@echo off
chcp 65001 > nul
title 一键喊话启动器
color 0A

echo 一键喊话功能基于Python的模拟键盘功能，暂不清楚是否有封号风险
echo.
color 0C
echo 1、退出程序请输入1
color 0A
echo 2、如需使用请输入2333
echo.

:input
set /p choice=请输入选择:

if "%choice%"=="2333" (
    start send.exe
    timeout /t 5 /nobreak > nul
    exit
) else if "%choice%"=="1" (
    exit
) else (
    echo 输入错误，请重新输入！
    goto input
)
