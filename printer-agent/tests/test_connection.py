"""
6C.3 DoD: unit tests for the connection-factory selection (usb/network/serial
/file/dummy), and that the Dummy/File modes work with zero physical hardware
-- the only two modes this environment can actually exercise (plan Q1).
"""

import sys
from pathlib import Path

import pytest
from escpos.printer import Dummy, File

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from connection import (  # noqa: E402
    UnsupportedConnectionModeError,
    build_printer,
    load_config,
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
        def __init__(self, id_vendor, id_product, timeout, in_ep=0x82, out_ep=0x01):
            calls.update(
                id_vendor=id_vendor, id_product=id_product, in_ep=in_ep, out_ep=out_ep
            )

    monkeypatch.setattr("escpos.printer.Usb", FakeUsb)
    printer = build_printer(
        {"mode": "usb", "usb": {"idVendor": "0x04b8", "idProduct": "0x0202"}}
    )
    assert isinstance(printer, FakeUsb)
    assert calls == {"id_vendor": 0x04B8, "id_product": 0x0202, "in_ep": 0x82, "out_ep": 0x01}


def test_serial_mode_builds_without_a_device_attached(monkeypatch):
    calls = {}

    class FakeSerial:
        def __init__(self, devfile, baudrate=9600):
            calls.update(devfile=devfile, baudrate=baudrate)

    monkeypatch.setattr("escpos.printer.Serial", FakeSerial)
    printer = build_printer({"mode": "serial", "serial": {"devfile": "COM3", "baudrate": 9600}})
    assert isinstance(printer, FakeSerial)
    assert calls == {"devfile": "COM3", "baudrate": 9600}
