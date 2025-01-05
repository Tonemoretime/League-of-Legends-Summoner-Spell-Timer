@echo off
chcp 65001 > nul
title 计时器启动器

echo 正在启动服务器...
start cmd /k server.exe

echo 等待服务器启动...
timeout /t 3 /nobreak > nul

echo 正在打开浏览器...
start http://localhost:8000/

echo 等待浏览器加载...
timeout /t 3 /nobreak > nul

echo.
echo 计时器已启动完成！
timeout /t 3 /nobreak > nul 