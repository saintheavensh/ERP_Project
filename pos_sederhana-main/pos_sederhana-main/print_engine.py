"""
Print Engine for POS New Majmu
================================
Handles formatting receipt text and sending it directly
to a Windows thermal printer via win32print.
Supports ESC/POS commands for thermal printers.
"""

import win32print
import win32ui
import os
import time
from dotenv import load_dotenv

import logging

load_dotenv()

PRINTER_WIDTH = int(os.getenv('PRINTER_WIDTH', '48'))

# Setup khusus Print Engine Log
printer_logger = logging.getLogger('printer_engine')
printer_logger.setLevel(logging.INFO)
fh = logging.FileHandler('print_engine.log', encoding='utf-8')
fh.setFormatter(logging.Formatter('%(asctime)s | %(levelname)s | %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
printer_logger.addHandler(fh)

def log_print(msg):
    # print(msg)  # Sekarang dinonaktifkan agar tidak mengotori terminal Backend
    printer_logger.info(msg)


def get_printer_name():
    """Get the configured printer name, or the Windows default printer."""
    configured = os.getenv('PRINTER_NAME', '').strip()
    if configured:
        return configured
    try:
        return win32print.GetDefaultPrinter()
    except Exception:
        return "(Tidak ada printer default)"


def get_printer_status(printer_name):
    """
    Check if the printer is available and physically connected.
    """
    try:
        handle = win32print.OpenPrinter(printer_name)
        try:
            info = win32print.GetPrinter(handle, 2)
            status = info.get('Status', 0)
            attributes = info.get('Attributes', 0)
            
            # PRINTER_STATUS_OFFLINE = 0x80
            # PRINTER_ATTRIBUTE_WORK_OFFLINE = 0x400
            is_offline = (status & 0x00000080) or (attributes & 0x00000400)
            is_error = (status & 0x00000002)
            is_out_of_paper = (status & 0x00000010)
            
            if is_offline or is_error:
                return "OFFLINE"
            if is_out_of_paper:
                return "PAPER_OUT"
            
            return "READY"
        finally:
            win32print.ClosePrinter(handle)
    except Exception as e:
        return "UNAVAILABLE"


def list_printers():
    """List all available printers on this system."""
    printers = []
    for flags, description, name, comment in win32print.EnumPrinters(
        win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
    ):
        printers.append({
            'name': name,
            'description': description,
            'is_default': name == win32print.GetDefaultPrinter()
        })
    return printers


# --- ESC/POS Command Constants ---
ESC = b'\x1b'
GS = b'\x1d'

CMD_INIT = ESC + b'\x40'            # Initialize printer
CMD_ALIGN_CENTER = ESC + b'\x61\x01'
CMD_ALIGN_LEFT = ESC + b'\x61\x00'
CMD_BOLD_ON = ESC + b'\x45\x01'
CMD_BOLD_OFF = ESC + b'\x45\x00'
CMD_FONT_NORMAL = ESC + b'\x4d\x00'
CMD_TITLE_FONT = ESC + b'\x21\x30'    # Double Height + Double Width
CMD_NORMAL_SIZE = ESC + b'\x21\x00' # Normal size
CMD_CUT = GS + b'\x56\x00'          # Full cut
CMD_PARTIAL_CUT = GS + b'\x56\x01'  # Partial cut
CMD_FEED_LINES = ESC + b'\x64'      # Feed n lines


def _center(text, width=None):
    """Center text within the printer width."""
    w = width or PRINTER_WIDTH
    return text.center(w)


def _left_right(left, right, width=None):
    """Format a line with left-aligned and right-aligned text."""
    w = width or PRINTER_WIDTH
    space = w - len(left) - len(right)
    if space < 1:
        space = 1
    return left + (' ' * space) + right


def _dashed_line(width=None):
    """Create a dashed separator line."""
    w = width or PRINTER_WIDTH
    return '-' * w


def _format_number(amount):
    """Format a number as Indonesian locale string."""
    return f"{int(amount):,}".replace(',', '.')


def format_receipt_text(receipt_data):
    """
    Format receipt data dict into plain text lines for thermal printing.

    Expected receipt_data structure:
    {
        "shop": { "name", "address", "phone", "cashier", "customerName",
                  "footerMessage", "footerSubMessage" },
        "items": [ { "name", "price", "qty" }, ... ],
        "payment": { "subtotal", "total", "cash", "change",
                     "paymentMethod", "status", "amountDue" },
        "datetime": { "date", "time" }
    }
    """
    shop = receipt_data.get('shop', {})
    items = receipt_data.get('items', [])
    payment = receipt_data.get('payment', {})
    dt = receipt_data.get('datetime', {})

    payment_method = payment.get('paymentMethod', 'TUNAI')
    tx_status = payment.get('status', 'LUNAS')
    amount_due = int(payment.get('amountDue', 0))

    lines = []

    # --- Header ---
    lines.append(_center(shop.get('name', 'TOKO')))
    address = shop.get('address', '')
    for line in address.split('\n'):
        if line.strip():
            lines.append(_center(line.strip()))
    lines.append(_center(f"No Telp {shop.get('phone', '')}"))
    lines.append(_dashed_line())

    # --- Date/Time, Kasir & Pelanggan ---
    lines.append(_left_right(
        dt.get('date', ''),
        f"Kasir : {shop.get('cashier', '')}"
    ))
    customer_name = shop.get('customerName', '-')
    lines.append(_left_right(
        dt.get('time', ''),
        f"Pelanggan : {customer_name}"
    ))
    lines.append(_dashed_line())

    # --- Items ---
    total_qty = 0
    for item in items:
        name = item.get('name', '')
        price = int(item.get('price', 0))
        qty = int(item.get('qty', 0))
        line_total = price * qty
        total_qty += qty

        lines.append(name)
        lines.append(_left_right(
            f"  {qty} x {_format_number(price)}",
            _format_number(line_total)
        ))

    lines.append(_dashed_line())

    # --- Summary ---
    lines.append(_left_right(f"Total QTY : {total_qty}", ''))
    lines.append(_left_right('Subtotal', _format_number(payment.get('subtotal', 0))))
    # --- Payment Info ---
    payment_sub_method = payment.get('paymentSubMethod', 'TUNAI')
    
    if payment_method == 'TEMPO':
        lines.append(_left_right('Metode', 'TEMPO (Hutang)'))
    elif payment_method == 'TRANSFER':
        lines.append(_left_right('Metode', f"TRANSFER ({payment_sub_method})"))
    else:
        lines.append(_left_right('Metode', 'TUNAI (CASH)'))
    
    lines.append(_dashed_line())

    # --- Payment Breakdown ---
    lines.append(_left_right('TOTAL', f"Rp. {_format_number(payment.get('total', 0))}"))

    if payment_method == 'TEMPO':
        lines.append(_left_right('Uang Muka', f"Rp. {_format_number(payment.get('cash', 0))}"))
        lines.append(_left_right('Sisa', f"Rp. {_format_number(amount_due)}"))
    else:
        lines.append(_left_right('Bayar', f"Rp. {_format_number(payment.get('cash', 0))}"))
        lines.append(_left_right('Kembali', f"Rp. {_format_number(payment.get('change', 0))}"))

    lines.append(_dashed_line())

    # --- Status ---
    status_label = 'BELUM LUNAS' if tx_status == 'BELUM_LUNAS' else 'LUNAS'
    lines.append(_left_right('Status', status_label))
    lines.append(_dashed_line())

    # --- Footer ---
    lines.append(_center(shop.get('footerMessage', 'TERIMA KASIH')))
    footer_sub = shop.get('footerSubMessage', '')
    if footer_sub:
        for line in footer_sub.split('\n'):
            if line.strip():
                lines.append(_center(line.strip()))

    lines.append('')
    lines.append('')
    lines.append('')

    return '\n'.join(lines)


def build_escpos_data(receipt_data):
    """
    Build raw ESC/POS byte data for direct thermal printer output.
    This gives best results on ESC/POS compatible thermal printers.
    """
    shop = receipt_data.get('shop', {})
    items = receipt_data.get('items', [])
    payment = receipt_data.get('payment', {})
    dt = receipt_data.get('datetime', {})

    payment_method = payment.get('paymentMethod', 'TUNAI')
    tx_status = payment.get('status', 'LUNAS')
    amount_due = int(payment.get('amountDue', 0))

    data = bytearray()
    data += CMD_INIT
    data += CMD_FONT_NORMAL

    def add_line(text=''):
        data.extend(text.encode('cp437', errors='replace'))
        data.extend(b'\n')

    def add_line_raw(raw_bytes):
        data.extend(raw_bytes)
        data.extend(b'\n')

    # --- Header (centered, bold) ---
    data += CMD_ALIGN_CENTER
    data += CMD_TITLE_FONT
    add_line(shop.get('name', 'TOKO').strip())
    data += CMD_NORMAL_SIZE
    data += CMD_BOLD_ON
    data += CMD_BOLD_OFF
    address = shop.get('address', '')
    for line in address.split('\n'):
        if line.strip():
            add_line(line.strip())
    add_line(f"No Telp {shop.get('phone', '')}")
    add_line(_dashed_line())

    # --- Date/Kasir & Pelanggan (left-aligned) ---
    data += CMD_ALIGN_LEFT
    add_line(_left_right(
        dt.get('date', ''),
        f"Kasir : {shop.get('cashier', '')}"
    ))
    customer_name = shop.get('customerName', '-')
    add_line(_left_right(
        dt.get('time', ''),
        f"Pelanggan : {customer_name}"
    ))
    add_line(_dashed_line())

    # --- Items ---
    total_qty = 0
    for item in items:
        name = item.get('name', '')
        price = int(item.get('price', 0))
        qty = int(item.get('qty', 0))
        line_total = price * qty
        total_qty += qty

        data += CMD_BOLD_ON
        add_line(name)
        data += CMD_BOLD_OFF
        add_line(_left_right(
            f"  {qty} x {_format_number(price)}",
            _format_number(line_total)
        ))

    add_line(_dashed_line())

    # --- Summary ---
    payment_sub_method = payment.get('paymentSubMethod', 'CASH')
    add_line(_left_right(f"Total QTY : {total_qty}", ''))
    add_line(_left_right('Subtotal', _format_number(payment.get('subtotal', 0))))
    
    if payment_method == 'TEMPO':
        add_line(_left_right('Metode', 'TEMPO'))
    elif payment_method == 'TRANSFER':
        add_line(_left_right('Metode', f"TRANSFER ({payment_sub_method})"))
    else:
        add_line(_left_right('Metode', 'TUNAI'))
        
    add_line(_dashed_line())

    # --- Payment ---
    data += CMD_BOLD_ON
    add_line(_left_right('TOTAL', f"Rp. {_format_number(payment.get('total', 0))}"))
    data += CMD_BOLD_OFF

    if payment_method == 'TEMPO':
        add_line(_left_right('Uang Muka', f"Rp. {_format_number(payment.get('cash', 0))}"))
        add_line(_left_right('Sisa', f"Rp. {_format_number(amount_due)}"))
    else:
        add_line(_left_right('Bayar', f"Rp. {_format_number(payment.get('cash', 0))}"))
        add_line(_left_right('Kembali', f"Rp. {_format_number(payment.get('change', 0))}"))

    add_line(_dashed_line())

    # --- Status ---
    status_label = 'BELUM LUNAS' if tx_status == 'BELUM_LUNAS' else 'LUNAS'
    add_line(_left_right('Status', status_label))
    add_line(_dashed_line())

    # --- Footer (centered) ---
    data += CMD_ALIGN_CENTER
    data += CMD_BOLD_ON
    add_line(shop.get('footerMessage', 'TERIMA KASIH'))
    data += CMD_BOLD_OFF
    footer_sub = shop.get('footerSubMessage', '')
    if footer_sub:
        for line in footer_sub.split('\n'):
            if line.strip():
                add_line(line.strip())
    # Feed and cut
    data += CMD_FEED_LINES + b'\x04'  # Feed 4 lines
    data += CMD_PARTIAL_CUT

    return bytes(data)


def get_printer_status(printer_name):
    """
    Check if the printer is available and physically connected.
    """
    try:
        handle = win32print.OpenPrinter(printer_name)
        try:
            info = win32print.GetPrinter(handle, 2)
            status = info.get('Status', 0)
            attributes = info.get('Attributes', 0)
            
            # PRINTER_STATUS_OFFLINE = 0x80
            # PRINTER_ATTRIBUTE_WORK_OFFLINE = 0x400
            is_offline = (status & 0x00000080) or (attributes & 0x00000400)
            is_error = (status & 0x00000002)
            is_out_of_paper = (status & 0x00000010)
            
            if is_offline or is_error:
                log_print(f"  [DEBUG] Status Printer '{printer_name}' Offline Detect: status={status}, attr={attributes}")
                return "OFFLINE"
            if is_out_of_paper:
                log_print(f"  [DEBUG] Status Printer '{printer_name}' Out of Paper: status={status}")
                return "PAPER_OUT"
            
            return "READY"
        finally:
            win32print.ClosePrinter(handle)
    except Exception as e:
        log_print(f"  [DEBUG] Status Printer '{printer_name}' Unavailable: {str(e)}")
        return "UNAVAILABLE"


def check_and_purge_job(printer_name, job_id):
    """
    Monitor a print job for a short time. 
    If it's stuck due to printer being offline, delete it to prevent ghost printing.
    """
    log_print(f"  [INFO] Menunggu konfirmasi spooler Windows (Job ID: {job_id})...")
    time.sleep(1.5)  # Jeda agar Spooler punya waktu untuk lapor status
    
    handle = win32print.OpenPrinter(printer_name)
    try:
        # JOB_STATUS_OFFLINE = 0x20 (32), JOB_STATUS_ERROR = 0x02 (2)
        job_info = win32print.GetJob(handle, job_id, 2)
        status = job_info.get('Status', 0)
        
        # Jika job masih ada dan statusnya bermasalah (Offline/Error)
        if status & 0x00000020 or status & 0x00000002:
            log_print(f"  [WARNING] GHOST PRINT TERDETEKSI! Job {job_id} tertahan dengan kode status: {status}")
            log_print(f"  [INFO] Menghapus Job {job_id} dari antrean untuk mencegah cetak tertunda.")
            # JOB_CONTROL_DELETE = 5
            win32print.SetJob(handle, job_id, 0, None, 5)
            return False, f"Antrean Job {job_id} dihapus paksa karena Printer Offline/Error."
            
        log_print(f"  [INFO] Job {job_id} berhasil diproses oleh Windows.")
        return True, "Cetak berhasil masuk antrean."
    except Exception as e:
        # Jika job sudah hilang (berarti sudah sukses dikirim ke printer)
        log_print(f"  [INFO] Job {job_id} sudah keluar dari antrean (Sukses).")
        return True, "Job sudah diproses."
    finally:
        win32print.ClosePrinter(handle)

def print_receipt(receipt_data, use_escpos=True):
    """
    Print a receipt after verifying the printer is online.
    This prevents jobs from staying in the Windows Spooler queue.
    """
    printer_name = get_printer_name()
    
    # CEK KRUSIAL 1: Cek fisik sebelum submit
    status = get_printer_status(printer_name)
    if status != "READY":
        log_print(f"  [WARNING] Pre-check Gagal: Printer '{printer_name}' berstatus {status}.")
        return {
            'success': False,
            'message': f'Printer sedang {status}. Pastikan kabel terhubung dan printer menyala.',
            'printer': printer_name
        }

    try:
        if use_escpos:
            result = _print_raw(receipt_data, printer_name)
        else:
            result = _print_text(receipt_data, printer_name)
            
        # CEK KRUSIAL 2: Cek status Job setelah submit (Pencegahan Ghost Print)
        if result['success'] and 'job_id' in result:
            success, message = check_and_purge_job(printer_name, result['job_id'])
            if not success:
                log_print(f"  [ERROR] Post-check Gagal: {message}")
                return {
                    'success': False,
                    'message': message,
                    'printer': printer_name
                }
        
        return result
    except Exception as e:
        log_print(f"  [ERROR] Exception saat proses cetak: {str(e)}")
        return {
            'success': False,
            'message': f'Gagal mencetak: {str(e)}',
            'printer': printer_name
        }


def _print_raw(receipt_data, printer_name):
    """Send raw ESC/POS bytes directly to the printer."""
    log_print(f"  [DEBUG] Menyiapkan data ESC/POS...")
    raw_data = build_escpos_data(receipt_data)

    log_print(f"  [DEBUG] Membuka koneksi printer: {printer_name}...")
    handle = win32print.OpenPrinter(printer_name)
    try:
        log_print(f"  [DEBUG] Memulai dokumen (StartDocPrinter)...")
        job = win32print.StartDocPrinter(handle, 1, ("POS Receipt", None, "RAW"))
        try:
            log_print(f"  [DEBUG] Memulai halaman (StartPagePrinter)...")
            win32print.StartPagePrinter(handle)
            log_print(f"  [DEBUG] Menulis data ke printer...")
            win32print.WritePrinter(handle, raw_data)
            log_print(f"  [DEBUG] Mengakhiri halaman...")
            win32print.EndPagePrinter(handle)
        finally:
            log_print(f"  [DEBUG] Mengakhiri dokumen...")
            win32print.EndDocPrinter(handle)
    finally:
        log_print(f"  [DEBUG] Menutup koneksi printer...")
        win32print.ClosePrinter(handle)

    return {
        'success': True,
        'message': f'Struk berhasil dikirim ke {printer_name}',
        'printer': printer_name,
        'job_id': job
    }


def _print_text(receipt_data, printer_name):
    """Send plain text to the printer using Windows GDI (fallback)."""
    log_print(f"  [DEBUG] Menyiapkan data teks (GDI Fallback)...")
    text = format_receipt_text(receipt_data)
    raw_bytes = text.encode('cp437', errors='replace')

    log_print(f"  [DEBUG] Membuka koneksi printer: {printer_name}...")
    handle = win32print.OpenPrinter(printer_name)
    try:
        log_print(f"  [DEBUG] Memulai dokumen (StartDocPrinter)...")
        job = win32print.StartDocPrinter(handle, 1, ("POS Receipt", None, "RAW"))
        try:
            log_print(f"  [DEBUG] Memulai halaman...")
            win32print.StartPagePrinter(handle)
            log_print(f"  [DEBUG] Menulis data teks ke printer...")
            win32print.WritePrinter(handle, raw_bytes)
            # Feed and cut
            win32print.WritePrinter(handle, CMD_FEED_LINES + b'\x04')
            win32print.WritePrinter(handle, CMD_PARTIAL_CUT)
            log_print(f"  [DEBUG] Mengakhiri halaman...")
            win32print.EndPagePrinter(handle)
        finally:
            log_print(f"  [DEBUG] Mengakhiri dokumen...")
            win32print.EndDocPrinter(handle)
    finally:
        log_print(f"  [DEBUG] Menutup koneksi printer...")
        win32print.ClosePrinter(handle)

    return {
        'success': True,
        'message': f'Struk berhasil dikirim ke {printer_name}',
        'printer': printer_name,
        'job_id': job
    }

if __name__ == "__main__":
    import sys
    import json
    if len(sys.argv) > 1:
        # Sedang dipanggil via CLI
        file_path = sys.argv[1]
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                payload = json.load(f)
                receipt_data = payload.get('receipt_data', payload)
                result = print_receipt(receipt_data, use_escpos=True)
                print(json.dumps(result))
        except Exception as e:
            print(json.dumps({"success": False, "message": str(e)}))

