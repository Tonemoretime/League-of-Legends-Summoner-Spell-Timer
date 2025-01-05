import keyboard
import time
from pyperclip import paste

def send_one_line(line, interval=0.1):
    # 按Enter进入聊天框
    keyboard.press_and_release('enter')
    time.sleep(interval)
    
    # 输入文本
    keyboard.write(line)
    time.sleep(interval)
    
    # 发送
    keyboard.press_and_release('enter')

def send_from_clipboard():
    # 初始延迟
    time.sleep(0.5)
    
    # 获取剪贴板内容并分割成行
    content = paste()
    lines = content.split('\n')
    
    # 过滤空行
    lines = [line.strip() for line in lines if line.strip()]
    
    for line in lines:
        # 检查是否按下了Alt键来停止发送
        if keyboard.is_pressed('alt'):
            break
            
        # 发送一行
        send_one_line(line, interval=0.1)
        
        # 行间延迟
        time.sleep(0.25)

def main():
    # 注册快捷键 CapsLock + G
    keyboard.add_hotkey('capslock+g', send_from_clipboard)
    
    # 保持程序运行
    keyboard.wait()

if __name__ == '__main__':
    print("程序已启动...")
    print("使用 CapsLock + G 发送剪贴板内容")
    print("使用 Alt 键停止发送")
    print("按 Ctrl+C 退出程序")
    main() 