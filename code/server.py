from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
    # 设置默认的 MIME 类型
    extensions_map = {
        '': 'application/octet-stream',
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.mp3': 'audio/mpeg',
    }

    def end_headers(self):
        # 添加 CORS 头，允许跨域请求
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        # 处理 favicon.ico 请求
        if self.path == '/favicon.ico':
            self.send_response(204)  # No Content
            self.end_headers()
            return
        return super().do_GET()

def run_server(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, CustomHTTPRequestHandler)
    print(f"Server running on port {port}...")
    print(f"Visit http://localhost:{port} to access the application")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server() 