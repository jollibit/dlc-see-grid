#!/usr/bin/env python3
import http.server
import ssl
import os
import subprocess
import sys

PORT = 8000
CERT_FILE = "cert.pem"
KEY_FILE = "key.pem"

def generate_cert():
    print("Generating self-signed certificate...")
    try:
        subprocess.run([
            "openssl", "req", "-x509", "-newkey", "rsa:4096",
            "-keyout", KEY_FILE, "-out", CERT_FILE,
            "-days", "365", "-nodes",
            "-subj", "/CN=localhost"
        ], check=True)
        print("Certificate generated successfully")
    except FileNotFoundError:
        print("OpenSSL not found. Please install OpenSSL and make sure it's in your PATH.")
        sys.exit(1)
    except Exception as e:
        print("Error generating certificate:", e)
        sys.exit(1)

if not (os.path.exists(CERT_FILE) and os.path.exists(KEY_FILE)):
    generate_cert()

Handler = http.server.SimpleHTTPRequestHandler
httpd = http.server.HTTPServer(("", PORT), Handler)

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile=CERT_FILE, keyfile=KEY_FILE)
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f"Serving HTTPS on https://localhost:{PORT}")
print("Press Ctrl+C to stop the server")

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nShutting down server")
    httpd.server_close()
