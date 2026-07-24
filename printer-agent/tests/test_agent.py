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
