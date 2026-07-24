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

from flask import Flask, jsonify, request, Response

from connection import get_printer
from escpos_translator import THERMAL_CHAR_WIDTH, UnknownBlockTypeError, blocks_to_escpos

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
