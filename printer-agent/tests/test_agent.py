"""
6C.1 DoD: `POST /print` with a sample block doc returns 200; bind is verified
localhost-only by reading HOST straight from printer_agent.py rather than
re-typing the literal (a copy-paste drift there would be a real localhost
security regression, not just a test going stale).
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import printer_agent  # noqa: E402


@pytest.fixture()
def client(monkeypatch, tmp_path):
    # No config.json in the test tree -> connection.load_config() defaults to
    # 'dummy' already, but pointing CONFIG_PATH at an empty tmp dir makes that
    # explicit and immune to a stray config.json ever being committed.
    monkeypatch.setattr("connection.CONFIG_PATH", str(tmp_path / "config.json"))
    printer_agent.app.config.update(TESTING=True)
    return printer_agent.app.test_client()


def test_binds_localhost_only():
    assert printer_agent.HOST == "127.0.0.1"


def test_health_ok(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok"}


def test_print_valid_receipt_returns_200(client):
    body = {
        "paperSize": "58mm",
        "blocks": [
            {"type": "text", "value": "TOKO SERVIS JAYA", "align": "center", "bold": True},
            {"type": "line"},
            {"type": "row", "value": "LCD iPhone 11    1x  350.000"},
            {"type": "total", "value": "TOTAL            350.000"},
            {"type": "cut"},
        ],
        "device": {"deviceId": "d1", "deviceName": "Kasir 1", "connectionType": "usb"},
    }
    res = client.post("/print", json=body)
    assert res.status_code == 200
    assert res.get_json() == {"status": "printed"}


def test_print_missing_blocks_returns_400(client):
    res = client.post("/print", json={"paperSize": "58mm", "blocks": []})
    assert res.status_code == 400


def test_print_bad_paper_size_returns_400(client):
    res = client.post("/print", json={"paperSize": "A5", "blocks": [{"type": "cut"}]})
    assert res.status_code == 400


def test_print_unknown_block_type_returns_400(client):
    res = client.post(
        "/print",
        json={"paperSize": "58mm", "blocks": [{"type": "barcode", "value": "x"}]},
    )
    assert res.status_code == 400


def test_options_preflight_has_cors_headers(client):
    res = client.options("/print")
    assert res.status_code == 204
    assert res.headers["Access-Control-Allow-Origin"] == "*"


def test_printers_scan_returns_detected_list(client, monkeypatch):
    fake_result = [{"name": "POS-80", "driver": "POS-80 11.3.0.0", "port": "USB001", "isDefault": True, "recommended": True}]
    monkeypatch.setattr("printer_agent.scan_windows_printers", lambda: fake_result)
    res = client.get("/printers")
    assert res.status_code == 200
    assert res.get_json() == {"data": fake_result}


def test_printers_scan_501_when_unavailable(client, monkeypatch):
    from connection import PrinterScanUnavailableError

    def raise_unavailable():
        raise PrinterScanUnavailableError("no pywin32 here")

    monkeypatch.setattr("printer_agent.scan_windows_printers", raise_unavailable)
    res = client.get("/printers")
    assert res.status_code == 501


def test_config_get_returns_current_config(client):
    res = client.get("/config")
    assert res.status_code == 200
    assert res.get_json()["data"]["mode"] == "dummy"


def test_config_post_persists_valid_win32_choice(client, tmp_path, monkeypatch):
    config_path = str(tmp_path / "config.json")
    monkeypatch.setattr("connection.CONFIG_PATH", config_path)
    monkeypatch.setattr("printer_agent.build_printer", lambda cfg: object())

    res = client.post("/config", json={"mode": "win32", "win32": {"printerName": "POS-80"}})
    assert res.status_code == 200
    assert res.get_json() == {"status": "saved"}

    res2 = client.get("/config")
    assert res2.get_json()["data"]["win32"]["printerName"] == "POS-80"


def test_config_post_rejects_unknown_mode(client):
    res = client.post("/config", json={"mode": "carrier-pigeon"})
    assert res.status_code == 400


def test_test_print_succeeds_against_the_default_dummy_config(client):
    res = client.post("/test-print", json={"paperSize": "80mm"})
    assert res.status_code == 200
    assert res.get_json() == {"status": "printed", "mode": "dummy"}


def test_test_print_defaults_paper_size_when_omitted(client):
    res = client.post("/test-print", json={})
    assert res.status_code == 200


def test_test_print_rejects_bad_paper_size(client):
    res = client.post("/test-print", json={"paperSize": "A5"})
    assert res.status_code == 400


def test_test_print_surfaces_connection_failure_as_502(client, monkeypatch):
    def raise_connect_error():
        raise RuntimeError("printer offline")

    monkeypatch.setattr("printer_agent.get_printer", raise_connect_error)
    res = client.post("/test-print", json={"paperSize": "58mm"})
    assert res.status_code == 502
