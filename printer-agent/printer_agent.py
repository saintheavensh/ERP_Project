"""
FlowServ local print agent (plan 6C.1).

A tiny Flask service that runs on the cashier's own computer and bridges the
browser to a physical ESC/POS thermal printer -- the browser itself cannot
open a USB/serial/network socket to a receipt printer (spec rule: "Browser
cannot access USB/serial printers directly - needs a local bridge").

Binds 127.0.0.1 ONLY. This must never accept a connection from another
machine on the network (spec: "Network scope: Localhost only"). Port 9100 is
fixed to match flowserv-web/src/lib/api/printer-agent.ts's PRINTER_AGENT_URL --
if you change it here, change it there too.

Run: python printer_agent.py
Packaged: see README.md for the PyInstaller --onefile build (6C.4).
"""

from __future__ import annotations

from datetime import datetime

from flask import Flask, jsonify, request, Response

from connection import (
    PrinterScanUnavailableError,
    SUPPORTED_MODES,
    UnsupportedConnectionModeError,
    build_printer,
    describe_config,
    get_printer,
    load_config,
    save_config,
    scan_windows_printers,
)
from escpos_translator import (
    THERMAL_CHAR_WIDTH,
    UnknownBlockTypeError,
    blocks_to_escpos,
    build_test_print_blocks,
)

HOST = "127.0.0.1"
PORT = 9100

app = Flask(__name__)


@app.after_request
def add_cors_headers(response: Response) -> Response:
    # Permissive CORS is safe here specifically because the socket is bound
    # to 127.0.0.1 above -- no request from outside this machine can ever
    # reach this process regardless of what this header says. This lets the
    # SvelteKit dev server (a different origin/port) and the eventual
    # production build both reach the agent with no per-deployment config.
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/health", methods=["GET"])
def health() -> tuple[Response, int]:
    return jsonify({"status": "ok"}), 200


@app.route("/printers", methods=["GET", "OPTIONS"])
def printers() -> tuple[Response, int]:
    """Scan installed Windows printers so the Settings UI can offer a "pick
    one" list instead of asking the cashier to type a USB vendor/product ID
    or IP address by hand. Read-only -- does not touch config.json."""
    if request.method == "OPTIONS":
        return jsonify({}), 204
    try:
        return jsonify({"data": scan_windows_printers()}), 200
    except PrinterScanUnavailableError as exc:
        return jsonify({"error": str(exc)}), 501


@app.route("/config", methods=["GET", "POST", "OPTIONS"])
def config_endpoint() -> tuple[Response, int]:
    """GET returns the current connection config; POST replaces it (used by
    the Settings UI's "scan and pick" flow to lock in a chosen printer with
    no manual file editing). Both act on THIS machine's config.json only --
    they never touch the multi-tenant printer_devices table in the main app
    database."""
    if request.method == "OPTIONS":
        return jsonify({}), 204

    if request.method == "GET":
        return jsonify({"data": load_config()}), 200

    body = request.get_json(silent=True, force=True) or {}
    mode = body.get("mode")
    if mode not in SUPPORTED_MODES:
        return jsonify({"error": f"mode must be one of {list(SUPPORTED_MODES)}"}), 400

    try:
        # Validate the config actually builds a printer before persisting it
        # -- a typo'd printer name would otherwise only surface on the next
        # real print, confusing the cashier about which step failed.
        build_printer(body)
    except (UnsupportedConnectionModeError, KeyError) as exc:
        return jsonify({"error": f"invalid config: {exc}"}), 400

    save_config(body)
    return jsonify({"status": "saved"}), 200


@app.route("/test-print", methods=["POST", "OPTIONS"])
def test_print() -> tuple[Response, int]:
    """Print a generic diagnostic receipt through whichever printer THIS
    machine's config.json currently points at -- so a cashier/admin can
    confirm "is this printer actually integrated correctly" without needing
    a real invoice. Reuses the exact same blocks_to_escpos() codepath a real
    receipt goes through (build_test_print_blocks() only supplies canned
    content), so a passing test print is real evidence the pipeline works,
    not a separate, less-trustworthy code path."""
    if request.method == "OPTIONS":
        return jsonify({}), 204

    body = request.get_json(silent=True, force=True) or {}
    paper_size = body.get("paperSize", "80mm")
    if paper_size not in THERMAL_CHAR_WIDTH:
        return jsonify({"error": f"paperSize must be one of {list(THERMAL_CHAR_WIDTH)}"}), 400

    config = load_config()
    width = THERMAL_CHAR_WIDTH[paper_size]
    blocks = build_test_print_blocks(
        width,
        describe_config(config),
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )

    try:
        printer = get_printer()
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"could not connect to printer: {exc}"}), 502

    try:
        blocks_to_escpos(printer, blocks, width)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"test print failed: {exc}"}), 500
    finally:
        close = getattr(printer, "close", None)
        if callable(close):
            close()

    return jsonify({"status": "printed", "mode": config.get("mode")}), 200


@app.route("/print", methods=["POST", "OPTIONS"])
def print_document() -> tuple[Response, int]:
    if request.method == "OPTIONS":
        # CORS preflight -- add_cors_headers() above already attaches the
        # Allow-* headers to this empty response.
        return jsonify({}), 204

    body = request.get_json(silent=True, force=True) or {}
    paper_size = body.get("paperSize")
    blocks = body.get("blocks")

    if paper_size not in THERMAL_CHAR_WIDTH:
        return jsonify({"error": f"paperSize must be one of {list(THERMAL_CHAR_WIDTH)}"}), 400
    if not isinstance(blocks, list) or not blocks:
        return jsonify({"error": "blocks must be a non-empty array"}), 400

    try:
        printer = get_printer()
    except Exception as exc:  # noqa: BLE001 -- surfaced to the cashier's screen, not a stack trace
        return jsonify({"error": f"could not connect to printer: {exc}"}), 502

    try:
        blocks_to_escpos(printer, blocks, THERMAL_CHAR_WIDTH[paper_size])
    except UnknownBlockTypeError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"print failed: {exc}"}), 500
    finally:
        close = getattr(printer, "close", None)
        if callable(close):
            close()

    return jsonify({"status": "printed"}), 200


if __name__ == "__main__":
    app.run(host=HOST, port=PORT)
