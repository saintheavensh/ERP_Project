"""
Printer connection factory (plan 6C.3).

The FE's request body carries `device: {deviceId, deviceName, connectionType}`
(flowserv-api's RenderedDocument.assignment) -- but that's the *branch's*
printer configuration in the multi-tenant database, not necessarily reachable
from this specific cashier computer (no connectionAddress is even sent to the
browser). Per the spec ("First-time setup: branch admin registers device via
Printer Settings UI" + this plan's own 6C.3 note), the actual physical
connection this agent drives is a decision made once, locally, on the machine
the agent runs on -- recorded in `config.json` next to this file, not trusted
from the network request. `device` from the request is accepted for logging /
future cross-check only.

`config.json` is git-ignored (each cashier machine has its own). Copy
`config.example.json` and fill in the real values for that computer's
printer. With no `config.json` present, the agent defaults to `dummy` --
harmless, produces no physical output, exactly what this repo needs since no
printer hardware exists in this environment (plan Q1).
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any

# A PyInstaller --onefile exe extracts itself into a fresh temp directory
# (sys._MEIPASS) on every launch and deletes it on exit -- `__file__` inside
# a frozen app resolves to a path INSIDE that ephemeral temp dir, not next to
# the real .exe. Using `__file__` unconditionally here would mean config.json
# (this agent's whole point -- persisting the cashier's printer choice) is
# silently reset to `dummy` every single run of the packaged exe, and every
# POST /config write vanishes the moment the process exits. `sys.frozen` is
# how PyInstaller signals "you are running from a bundle"; in that case, walk
# next to sys.executable (the actual printer-agent.exe) instead.
def _resolve_base_dir() -> str:
    if getattr(sys, "frozen", False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


CONFIG_PATH = os.path.join(_resolve_base_dir(), "config.json")

SUPPORTED_MODES = ("usb", "network", "serial", "win32", "file", "dummy")

# Driver-name keywords that suggest "this is probably a receipt printer, not
# a PDF writer / fax / OneNote" -- used only to sort the scan results and add
# a "recommended" hint; the user always picks explicitly, this never
# auto-selects on its own.
_THERMAL_DRIVER_HINTS = (
    "pos", "epson", "star", "xprinter", "gprinter", "bixolon", "citizen",
    "sewoo", "thermal", "receipt", "tm-", "tm ", "rp-", "srp-", "escpos",
)
# Windows queues that are never a physical printer -- never worth flagging
# as "recommended" regardless of driver name.
_VIRTUAL_PORTS = {"nul:", "portprompt:", "shrfax:", "file:"}


class UnsupportedConnectionModeError(ValueError):
    pass


class PrinterScanUnavailableError(RuntimeError):
    """Raised when Windows printer scanning is requested on a non-Windows
    host, or pywin32 isn't installed -- both cases where win32print can't be
    imported."""


def load_config(path: str | None = None) -> dict:
    # `path` defaults via `None` + a lookup at CALL time (not a bound default
    # argument) specifically so tests can `monkeypatch.setattr("connection.
    # CONFIG_PATH", tmp_path)` and have every no-arg caller (printer_agent.py
    # never passes `path` explicitly) actually honor it. A `path: str =
    # CONFIG_PATH` default is evaluated once at function-definition time and
    # would silently keep pointing at the real on-disk config.json forever
    # after that -- which is exactly the bug this comment replaced: the test
    # suite was overwriting the real, git-ignored config.json on every run.
    path = path or CONFIG_PATH
    if not os.path.exists(path):
        return {"mode": "dummy"}
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    data.setdefault("mode", "dummy")
    return data


def save_config(config: dict, path: str | None = None) -> None:
    """Persist a connection config chosen through the "scan and pick" flow
    (printer_agent.py's POST /config) so the next /print call uses it with no
    manual file editing. Validated by the caller (mode must be one of
    SUPPORTED_MODES) before this is called. See load_config()'s docstring for
    why `path` defaults via `None`, not `= CONFIG_PATH`.
    """
    path = path or CONFIG_PATH
    with open(path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)


def scan_windows_printers() -> list[dict]:
    """List printers already installed in Windows (Settings > Printers &
    Scanners) so the cashier picks one by name instead of looking up a USB
    vendor/product ID or IP address. This is what makes 'win32' mode
    zero-configuration: most receipt printers register themselves as a
    Windows printer queue when their driver is installed, and raw ESC/POS
    bytes can be sent straight through that queue via python-escpos's
    Win32Raw (bypassing GDI, using the 'RAW' spooler datatype) -- no direct
    USB/serial wiring needed at all.

    Every entry is real, installed hardware/software the OS already knows
    about; `recommended` is only a sorting hint (driver-name keyword match or
    a non-virtual port), never a filter -- the user always sees everything
    and picks explicitly.
    """
    try:
        import win32print
    except ImportError as exc:
        raise PrinterScanUnavailableError(
            "Printer scanning needs Windows + pywin32, which isn't available here."
        ) from exc

    try:
        default_name = win32print.GetDefaultPrinter()
    except Exception:  # noqa: BLE001 -- no default printer configured at all
        default_name = None

    flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
    results = []
    for p in win32print.EnumPrinters(flags, None, 2):
        name = p.get("pPrinterName", "")
        driver = p.get("pDriverName", "") or ""
        port = p.get("pPortName", "") or ""
        recommended = (
            any(hint in driver.lower() for hint in _THERMAL_DRIVER_HINTS)
            or (port.lower() not in _VIRTUAL_PORTS and bool(port))
        )
        results.append(
            {
                "name": name,
                "driver": driver,
                "port": port,
                "isDefault": name == default_name,
                "recommended": recommended,
            }
        )

    results.sort(key=lambda r: (not r["recommended"], not r["isDefault"], r["name"]))
    return results


def build_printer(config: dict) -> Any:
    """Pure factory: config dict -> a python-escpos printer instance.
    Deliberately does not import escpos.printer at module load time for the
    branches that aren't used, so a machine without USB drivers installed can
    still run this agent in 'dummy'/'file'/'network' mode without error.
    """
    mode = config.get("mode", "dummy")

    if mode == "dummy":
        from escpos.printer import Dummy

        return Dummy()

    if mode == "file":
        from escpos.printer import File

        file_cfg = config.get("file", {})
        return File(file_cfg.get("path", "printer_output.bin"))

    if mode == "usb":
        from escpos.printer import Usb

        usb_cfg = config["usb"]
        # timeout MUST be passed by keyword -- Usb's 3rd positional parameter
        # is usb_args (a dict), not timeout. A positional non-zero timeout
        # here would silently land in usb_args instead and blow up later with
        # "'int' object does not support item assignment" the first time a
        # real device connects (found while verifying this factory live).
        return Usb(
            int(usb_cfg["idVendor"], 16),
            int(usb_cfg["idProduct"], 16),
            timeout=usb_cfg.get("timeout", 0),
            in_ep=usb_cfg.get("in_ep", 0x82),
            out_ep=usb_cfg.get("out_ep", 0x01),
        )

    if mode == "network":
        from escpos.printer import Network

        net_cfg = config["network"]
        return Network(net_cfg["host"], port=net_cfg.get("port", 9100))

    if mode == "serial":
        from escpos.printer import Serial

        serial_cfg = config["serial"]
        return Serial(
            devfile=serial_cfg["devfile"],
            baudrate=serial_cfg.get("baudrate", 9600),
        )

    if mode == "win32":
        from escpos.printer import Win32Raw

        win32_cfg = config.get("win32", {})
        # Empty printer_name makes Win32Raw fall back to the Windows default
        # printer at print time -- still explicit here rather than implicit,
        # since "which printer" should always be a decision the scan-and-pick
        # flow made, not a silent default.
        return Win32Raw(win32_cfg.get("printerName", ""))

    raise UnsupportedConnectionModeError(
        f"connection mode '{mode}' is not one of {SUPPORTED_MODES}"
    )


def get_printer(config_path: str | None = None) -> Any:
    return build_printer(load_config(config_path))


def describe_config(config: dict) -> str:
    """One-line human-readable summary of the active connection, printed on
    the test-print receipt itself (POST /test-print) so the cashier can see
    exactly which config produced that piece of paper -- useful when
    swapping printers/modes and re-testing."""
    mode = config.get("mode", "dummy")
    if mode == "win32":
        name = config.get("win32", {}).get("printerName") or "(default Windows printer)"
        return f"win32: {name}"
    if mode == "network":
        net_cfg = config.get("network", {})
        return f"network: {net_cfg.get('host', '?')}:{net_cfg.get('port', 9100)}"
    if mode == "usb":
        usb_cfg = config.get("usb", {})
        return f"usb: {usb_cfg.get('idVendor', '?')}:{usb_cfg.get('idProduct', '?')}"
    if mode == "serial":
        return f"serial: {config.get('serial', {}).get('devfile', '?')}"
    if mode == "file":
        return f"file: {config.get('file', {}).get('path', '?')}"
    return mode
