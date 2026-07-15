"""
POS New Majmu - HTTP Server with Print Server
==============================================
Serves the POS web app AND acts as a print server.
When a device on the network sends a print request,
this server prints directly to the default Windows printer.

Cara pakai:
    1. Double-click start_pos.bat, ATAU
    2. Buka terminal, ketik: python server.py

Lalu buka browser di HP Android dan akses alamat yang muncul.
"""

import http.server
from http.server import ThreadingHTTPServer
import socket
import json
import os
import sys
import webbrowser
import urllib.request
from datetime import datetime
from dotenv import load_dotenv
import sqlite3

load_dotenv()

from print_engine import print_receipt, list_printers, get_printer_name, get_printer_status, log_print
import logging

# ==========================================
# SETUP LOGGING (Catat Ke File & Terminal)
# ==========================================
logging.basicConfig(
    filename='pos_server.log',
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    encoding='utf-8'
)

class LoggerWriter:
    def __init__(self, level, original_stream):
        self.level = level
        self.original_stream = original_stream

    def write(self, message):
        self.original_stream.write(message)
        if message.strip():
            self.level(message.strip())

    def flush(self):
        self.original_stream.flush()

# Replace default print/error outputs so they go to the log file too!
sys.stdout = LoggerWriter(logging.info, sys.stdout)
sys.stderr = LoggerWriter(logging.error, sys.stderr)

PORT = int(os.getenv('PORT', '8080'))
UI_PORT = 5173  # Port untuk Frontend Vite



class POSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler that serves static files and handles print API."""

    def do_GET(self):
        """Handle GET requests — static files + server info API."""
        if self.path == '/api/server-info':
            self._handle_server_info()
        elif self.path == '/api/printer/status':
            self._handle_printer_status()
        else:
            super().do_GET()

    def do_POST(self):
        """Handle POST requests for the print API."""
        if self.path == '/api/print':
            self._handle_print()
        elif self.path == '/api/printers':
            self._handle_list_printers()
        else:
            self._send_json(404, {'success': False, 'message': 'Not found'})

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def _handle_print(self):
        """Process a print request from the frontend."""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            receipt_data = json.loads(body.decode('utf-8'))

            log_print(f"  [DEBUG] Data diterima dari HP:")
            log_print(f"Print request received for shop: {receipt_data.get('shop', {}).get('name')}")
            log_print(f"  [DEBUG] Nama : {receipt_data.get('shop', {}).get('name')}")
            log_print(f"  [DEBUG] Alamat : {repr(receipt_data.get('shop', {}).get('address'))}")

            # Validate required fields
            if not receipt_data.get('items'):
                self._send_json(400, {
                    'success': False,
                    'message': 'Data struk kosong (tidak ada items)'
                })
                return

            # Guard: Cek status printer sebelum memulai proses
            printer_name = get_printer_name()
            printer_status = get_printer_status(printer_name)
            
            if printer_status != "READY":
                log_print(f"  [WARNING] PERMINTAAN CETAK DITOLAK: Kondisi printer '{printer_name}' adalah {printer_status}.")
                log_print(f"  [DEBUG] Alasan: Menghindari penumpukan antrean hantu di Windows Spooler.")
                self._send_json(200, {
                    'success': False,
                    'message': f'Printer sedang {printer_status}. Pastikan kabel USB terhubung.',
                    'printer': printer_name
                })
                return

            # 2b. AMBIL NAMA KASIR DARI DATABASE (BERDASARKAN DEVICE_ID)
            device_id = receipt_data.get('device_id', 'UNKNOWN')
            cashier_name = "Kasir Utama"
            
            try:
                # Query ke database yang sama dengan Backend Hono
                db_path = os.path.join(os.path.dirname(__file__), 'pos_records.db')
                with sqlite3.connect(db_path) as conn:
                    conn.row_factory = sqlite3.Row
                    cursor = conn.cursor()
                    cursor.execute("SELECT name FROM devices WHERE device_id = ?", (device_id,))
                    row = cursor.fetchone()
                    if row:
                        cashier_name = row['name']
                        log_print(f"  [INFO] Kasir terdeteksi: {cashier_name} (ID: {device_id})")
            except Exception as e:
                log_print(f"  [WARNING] Gagal query nama kasir: {str(e)}")

            # Update data sebelum dicetak & disimpan
            if 'shop' not in receipt_data: receipt_data['shop'] = {}
            receipt_data['shop']['cashier'] = cashier_name
            
            log_print(f"  [DEBUG] Payload ke DB: ID={device_id}, Kasir={cashier_name}, Method={receipt_data.get('payment', {}).get('paymentMethod')}")

            # Print the receipt
            log_print(f"  [INFO] Memulai proses cetak ke: {printer_name}...")
            result = print_receipt(receipt_data, use_escpos=True)
            
            if result['success']:
                log_print(f"  [SUCCESS] Berhasil dikirim ke spooler: {result['printer']}")
                
                # BRIDGE KE DATABASE (HONO)
                try:
                    # Persiapkan data untuk Hono
                    payment = receipt_data.get('payment', {})
                    raw_method = payment.get('paymentMethod', 'TUNAI')
                    sub_method = payment.get('paymentSubMethod', '')
                    
                    # Gabungkan agar di Riwayat muncul "TRANSFER (BCA)"
                    full_payment_method = raw_method
                    if raw_method == 'TRANSFER' and sub_method:
                        full_payment_method = f"{raw_method} ({sub_method})"
                    
                    db_payload = {
                        'receipt_no': receipt_data.get('receipt_no', f"POS-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
                        'customer_name': receipt_data.get('customer_name', '-'),
                        'cashier_name': cashier_name,
                        'total': payment.get('total', 0),
                        'cash_paid': payment.get('cash', 0),
                        'change_amount': payment.get('change', 0),
                        'amount_due': payment.get('amountDue', 0),
                        'payment_method': full_payment_method,
                        'status': payment.get('status', 'LUNAS'),
                        'items_json': receipt_data.get('items', []),
                        'device_id': device_id
                    }
                    
                    req = urllib.request.Request(
                        "http://localhost:3000/api/transactions",
                        data=json.dumps(db_payload).encode('utf-8'),
                        headers={'Content-Type': 'application/json'},
                        method='POST'
                    )
                    
                    with urllib.request.urlopen(req, timeout=2) as response:
                        log_print(f"  [SUCCESS] Transaksi berhasil dicatat ke Database Hono.")
                        
                except Exception as db_err:
                    log_print(f"  [WARNING] Gagal mencatat ke Database Hono: {str(db_err)}")
                    # Tidak membatalkan sukses cetak karena ini hanya logger
            else:
                log_print(f"  [ERROR] GAGAL CETAK: {result['message']}")
                
            log_print(f"  [INFO] Transaksi selesai diproses. Status sukses: {result['success']}")
            
            status_code = 200 if result['success'] else 500
            self._send_json(status_code, result)

        except json.JSONDecodeError as jde:
            log_print(f"  [ERROR] Data JSON tidak valid: {str(jde)}")
            self._send_json(400, {
                'success': False,
                'message': 'Format data tidak valid (bukan JSON)'
            })
        except Exception as e:
            log_print(f"  [CRITICAL] Server Error internal: {str(e)}")
            import traceback
            log_print(traceback.format_exc())
            self._send_json(500, {
                'success': False,
                'message': f'Server error: {str(e)}'
            })

    def _handle_list_printers(self):
        """Return list of available printers."""
        try:
            printers = list_printers()
            self._send_json(200, {
                'success': True,
                'printers': printers,
                'active': get_printer_name()
            })
        except Exception as e:
            self._send_json(500, {
                'success': False,
                'message': f'Gagal memuat daftar printer: {str(e)}'
            })

    def _handle_printer_status(self):
        """Check status of the active printer."""
        try:
            printer_name = get_printer_name()
            status = get_printer_status(printer_name)
            self._send_json(200, {
                'success': True,
                'printer': printer_name,
                'status': status
            })
        except Exception as e:
            self._send_json(500, {
                'success': False,
                'message': str(e)
            })



    def _handle_server_info(self):
        """Return server's LAN IP and both Backend & Frontend info."""
        self._send_json(200, {
            'success': True,
            'ip': get_local_ip(),
            'backend_port': PORT,
            'frontend_port': UI_PORT,
            'url': f"http://{get_local_ip()}:{UI_PORT}"  # HP harus masuk ke UI Svelte
        })

    def _send_json(self, status_code, data):
        """Send a JSON response."""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _set_cors_headers(self):
        """Set CORS headers to allow requests from any origin."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def handle_one_request(self):
        """Override to suppress annoying connection aborted errors from browser."""
        try:
            super().handle_one_request()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass
    def address_string(self):
        """
        [PENTING] Nonaktifkan Reverse DNS Lookup!
        Secara default, Python Http.server mencoba melacak nama domain dari IP HP.
        Hal ini memakan waktu 5-10 detik jika gagal, yang membuat loading PWA di HP macet parah (sangat lama).
        Kode ini memaksa server langsung mengembalikan IP saja tanpa basa-basi DNS.
        """
        return self.client_address[0]

    def log_message(self, format, *args):
        """Custom log format with emoji indicators."""
        method = args[0] if args else ''
        if 'POST /api/print' in str(method):
            print(f"  🖨️  Print request: {args[1]} {args[2]}")
        elif 'POST' in str(method):
            print(f"  📡 API: {args[0]} → {args[1]}")
        else:
            # Silence normal static file requests to keep console clean
            pass


def get_local_ip():
    """Get the local network IP address of this machine."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("8.8.8.8", 80))
        ip = sock.getsockname()[0]
        sock.close()
        return ip
    except Exception:
        return "127.0.0.1"


def main():
    # Change to the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    local_ip = get_local_ip()
    printer_name = get_printer_name()

    server = ThreadingHTTPServer(("0.0.0.0", PORT), POSRequestHandler)

    hostname = socket.gethostname().lower()

    # Generate QR Code for easy mobile access
    try:
        import qrcode
        qr = qrcode.QRCode(version=1, box_size=1, border=4)
        # HP harus masuk ke interface (Frontend), bukan API
        qr.add_data(f"http://{local_ip}:{UI_PORT}")
        qr.make(fit=True)
        
        print(f"  📸 SCAN UNTUK BUKA DI HP (Mode Akses):")
        qr.print_ascii(invert=True)
        print()
    except Exception as e:
        # Silently fail if qrcode library is missing or error
        pass

    print("=" * 56)
    print(f"  \U0001f4f1 Buka di HP Android: http://{local_ip}:{UI_PORT}")
    print(f"  \U0001f4bb Buka di PC ini    : http://localhost:{UI_PORT}")
    print(f"  \U0001f5a8\ufe0f  Printer aktif     : {printer_name}")
    print("=" * 56)
    print("  Tekan Ctrl+C untuk menghentikan server")
    print("=" * 56)
    print()

    # Anti-Double Tab (Mencegah membuka browser 2x jika skrip tereksekusi ganda)
    import time
    lock_file = os.path.join(script_dir, 'browser_tab.lock')
    should_open_browser = True
    
    try:
        if os.path.exists(lock_file):
            with open(lock_file, 'r') as f:
                last_time = float(f.read().strip())
            # Jika selisih waktu dari buka terakhir kurang dari 15 detik, jangan buka lagi
            if time.time() - last_time < 15:
                should_open_browser = False
    except Exception:
        pass

    if should_open_browser:
        webbrowser.open(f"http://localhost:5173")
        try:
            with open(lock_file, 'w') as f:
                f.write(str(time.time()))
        except Exception:
            pass
    else:
        print("  \U0001f6ab Mencegah pembukaan Chrome ganda...")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n  ✅ Server dihentikan. Sampai jumpa!")
        server.server_close()
        sys.exit(0)


if __name__ == "__main__":
    main()
