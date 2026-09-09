import subprocess
import socket
import sys
import threading
import os
import signal

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def print_output(process, prefix):
    for line in iter(process.stdout.readline, b''):
        text = line.decode('utf-8', errors='replace')
        safe = text.encode(sys.stdout.encoding or 'utf-8', errors='replace').decode(sys.stdout.encoding or 'utf-8', errors='replace')
        print(f"[{prefix}] {safe}", end='', flush=True)

def main():
    local_ip = get_local_ip()
    print("=" * 55)
    print("  MessageAura -- Bot Control Panel")
    print("=" * 55)
    print(f"  Local URL  : http://localhost:5173")
    print(f"  LAN URL    : http://{local_ip}:5173")
    print(f"  Backend    : http://localhost:3001")
    print("=" * 55 + "\n")

    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")

    backend_process = subprocess.Popen(
        "node server.js",
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        shell=True
    )

    frontend_process = subprocess.Popen(
        "npm run dev -- --host",
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        shell=True
    )

    backend_thread = threading.Thread(target=print_output, args=(backend_process, "BACKEND"))
    frontend_thread = threading.Thread(target=print_output, args=(frontend_process, "FRONTEND"))
    
    backend_thread.daemon = True
    frontend_thread.daemon = True

    backend_thread.start()
    frontend_thread.start()

    def signal_handler(sig, frame):
        print("\n[SYSTEM] MessageAura kapatılıyor...")
        if os.name == 'nt':
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(backend_process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(frontend_process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            backend_process.terminate()
            frontend_process.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        while True:
            backend_thread.join(1)
            frontend_thread.join(1)
            if not backend_thread.is_alive() and not frontend_thread.is_alive():
                break
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

if __name__ == "__main__":
    main()
