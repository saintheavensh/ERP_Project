"""
6C.3 DoD: unit tests for the connection-factory selection (usb/network/serial
/file/dummy), and that the Dummy/File modes work with zero physical hardware
-- the only two modes this environment can actually exercise (plan Q1).
"""

import json
import os
import sys
from pathlib import Path

import pytest
from escpos.printer import Dummy, File

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import connection  # noqa: E402
from connection import (  # noqa: E402
    PrinterScanUnavailableError,
    UnsupportedConnectionModeError,
    _resolve_base_dir,
    build_printer,
    load_config,
    save_config,
    scan_windows_printers,
)


def test_no_config_file_defaults_to_dummy(tmp_path):
    config = load_config(str(tmp_path / "does-not-exist.json"))
    assert config == {"mode": "dummy"}
    printer = build_printer(config)
    assert isinstance(printer, Dummy)


def test_dummy_mode_explicit():
    printer = build_printer({"mode": "dummy"})
    assert isinstance(printer, Dummy)


def test_file_mode_writes_to_configured_path(tmp_path):
    target = tmp_path / "printer_output.bin"
    printer = build_printer({"mode": "file", "file": {"path": str(target)}})
    assert isinstance(printer, File)
    printer.text("hello\n")
    printer.close()
    assert target.exists()
    assert b"hello" in target.read_bytes()


def test_unknown_mode_raises():
    with pytest.raises(UnsupportedConnectionModeError):
        build_printer({"mode": "bluetooth-carrier-pigeon"})


def test_network_mode_builds_without_connecting(monkeypatch):
    # Network() opens a real socket in its constructor in some python-escpos
    # versions; since no printer is reachable in this environment, only
    # assert the factory *selects* the right class -- actual connectivity is
    # the 6D.1 physical checklist's job, not this unit test's.
    calls = {}

    class FakeNetwork:
        def __init__(self, host, port=9100):
            calls["host"] = host
            calls["port"] = port

    monkeypatch.setattr("escpos.printer.Network", FakeNetwork)
    printer = build_printer({"mode": "network", "network": {"host": "192.168.1.50", "port": 9100}})
    assert isinstance(printer, FakeNetwork)
    assert calls == {"host": "192.168.1.50", "port": 9100}


def test_usb_mode_builds_without_a_device_attached(monkeypatch):
    calls = {}

    class FakeUsb:
        # Mirrors the REAL escpos.printer.Usb signature -- timeout is
        # keyword-only from this factory's call site (its 3rd positional
        # parameter is actually `usb_args`, a dict; a positional int there
        # was a real bug this test now guards against).
        def __init__(self, id_vendor, id_product, timeout=0, in_ep=0x82, out_ep=0x01):
            calls.update(
                id_vendor=id_vendor, id_product=id_product, timeout=timeout, in_ep=in_ep, out_ep=out_ep
            )

    monkeypatch.setattr("escpos.printer.Usb", FakeUsb)
    printer = build_printer(
        {"mode": "usb", "usb": {"idVendor": "0x04b8", "idProduct": "0x0202", "timeout": 5000}}
    )
    assert isinstance(printer, FakeUsb)
    assert calls == {
        "id_vendor": 0x04B8, "id_product": 0x0202, "timeout": 5000, "in_ep": 0x82, "out_ep": 0x01,
    }


def test_win32_mode_builds_without_a_real_printer(monkeypatch):
    calls = {}

    class FakeWin32Raw:
        def __init__(self, printer_name=""):
            calls["printer_name"] = printer_name

    monkeypatch.setattr("escpos.printer.Win32Raw", FakeWin32Raw)
    printer = build_printer({"mode": "win32", "win32": {"printerName": "POS-80"}})
    assert isinstance(printer, FakeWin32Raw)
    assert calls == {"printer_name": "POS-80"}


def test_win32_mode_defaults_to_empty_printer_name(monkeypatch):
    calls = {}

    class FakeWin32Raw:
        def __init__(self, printer_name=""):
            calls["printer_name"] = printer_name

    monkeypatch.setattr("escpos.printer.Win32Raw", FakeWin32Raw)
    build_printer({"mode": "win32"})
    assert calls == {"printer_name": ""}


def test_scan_windows_printers_flags_thermal_driver_and_default(monkeypatch):
    class FakeWin32Print:
        PRINTER_ENUM_LOCAL = 2
        PRINTER_ENUM_CONNECTIONS = 4

        @staticmethod
        def GetDefaultPrinter():
            return "POS-80"

        @staticmethod
        def EnumPrinters(flags, name, level):
            return [
                {"pPrinterName": "POS-80", "pDriverName": "POS-80 11.3.0.0", "pPortName": "USB001"},
                {"pPrinterName": "Microsoft Print to PDF", "pDriverName": "Microsoft Print To PDF", "pPortName": "PORTPROMPT:"},
                {"pPrinterName": "Fax", "pDriverName": "Microsoft Shared Fax Driver", "pPortName": "SHRFAX:"},
            ]

    monkeypatch.setitem(sys.modules, "win32print", FakeWin32Print)
    results = scan_windows_printers()

    by_name = {r["name"]: r for r in results}
    assert by_name["POS-80"]["recommended"] is True
    assert by_name["POS-80"]["isDefault"] is True
    assert by_name["Microsoft Print to PDF"]["recommended"] is False
    assert by_name["Fax"]["recommended"] is False
    # Recommended + default sorts first.
    assert results[0]["name"] == "POS-80"


def test_scan_windows_printers_raises_when_pywin32_missing(monkeypatch):
    monkeypatch.setitem(sys.modules, "win32print", None)
    with pytest.raises(PrinterScanUnavailableError):
        scan_windows_printers()


def test_resolve_base_dir_uses_source_file_dir_when_not_frozen(monkeypatch):
    monkeypatch.delattr(sys.modules["sys"], "frozen", raising=False)
    result = _resolve_base_dir()
    assert result == os.path.dirname(os.path.abspath(connection.__file__))


def test_resolve_base_dir_uses_executable_dir_when_frozen(monkeypatch):
    # Regression test for a real bug: a PyInstaller --onefile exe extracts
    # into a fresh temp dir every launch, and `__file__` inside that bundle
    # points INTO the temp dir, not next to the real .exe. Before this fix,
    # config.json (this agent's whole reason for existing -- persisting the
    # cashier's printer choice) silently reset to `dummy` on every run of the
    # packaged exe, and every POST /config write vanished when the process
    # exited. `sys.frozen` is how PyInstaller signals "running from a bundle".
    monkeypatch.setattr(sys, "frozen", True, raising=False)
    monkeypatch.setattr(sys, "executable", r"C:\Program Files\FlowServ\printer-agent.exe", raising=False)
    result = _resolve_base_dir()
    assert result == r"C:\Program Files\FlowServ"


def test_save_config_then_load_roundtrips(tmp_path):
    path = str(tmp_path / "config.json")
    save_config({"mode": "win32", "win32": {"printerName": "Kasir 1"}}, path)
    assert load_config(path) == {"mode": "win32", "win32": {"printerName": "Kasir 1"}}
    # File is real, human-readable JSON -- not just round-trippable via our
    # own loader -- since a cashier or support tech may open it directly.
    with open(path) as f:
        raw = json.load(f)
    assert raw["win32"]["printerName"] == "Kasir 1"


def test_serial_mode_builds_without_a_device_attached(monkeypatch):
    calls = {}

    class FakeSerial:
        def __init__(self, devfile, baudrate=9600):
            calls.update(devfile=devfile, baudrate=baudrate)

    monkeypatch.setattr("escpos.printer.Serial", FakeSerial)
    printer = build_printer({"mode": "serial", "serial": {"devfile": "COM3", "baudrate": 9600}})
    assert isinstance(printer, FakeSerial)
    assert calls == {"devfile": "COM3", "baudrate": 9600}
