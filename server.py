import http.server
import json
import os
import urllib.parse

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class AdminPortalHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/api/researchers':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                # Write to researchers.json
                with open(os.path.join(DIRECTORY, 'researchers.json'), 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Researchers updated"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
                
        elif parsed_path.path == '/api/publications':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                # Load current database, replace results and save
                db_path = os.path.join(DIRECTORY, 'data.json')
                if os.path.exists(db_path):
                    with open(db_path, 'r', encoding='utf-8') as f:
                        db = json.load(f)
                else:
                    db = {"status": "success", "data_source": "manual", "results": []}
                
                db["results"] = data
                with open(db_path, 'w', encoding='utf-8') as f:
                    json.dump(db, f, ensure_ascii=False, indent=2)
                    
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Publications updated"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
        elif parsed_path.path == '/api/sync':
            try:
                import subprocess
                script_path = os.path.join(DIRECTORY, 'fetch_data.py')
                subprocess.Popen(['python', script_path], cwd=DIRECTORY)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Sync started in background"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    # Use localhost or 0.0.0.0
    server = http.server.HTTPServer(('localhost', PORT), AdminPortalHandler)
    print(f"Dashboard & Admin API Server running on http://localhost:{PORT}")
    server.serve_forever()
