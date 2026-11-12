"""
CineScope Local Development Server
Serves static files with Cross-Origin-Opener-Policy: same-origin-allow-popups
"""
import http.server
import socketserver
import sys

PORT = 8000

class COOPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    # Allow port reuse immediately after restart
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", port), COOPHandler) as httpd:
        print(f"🎬 CineScope dev server running at: http://localhost:{port}")
        print("🔒 Header enabled: Cross-Origin-Opener-Policy: same-origin-allow-popups")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

