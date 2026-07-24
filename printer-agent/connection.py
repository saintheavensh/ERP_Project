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
from typing import Any

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

SUPPORTED_MODES = ("usb", "network", "serial", "file", "dummy")


class UnsupportedConnectionModeError(ValueError):
    pass


def load_config(path: str = CONFIG_PATH) -> dict:
    if not os.path.exists(path):
        return {"mode": "dummy"}
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    data.setdefault("mode", "dummy")
    return data


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
        return Usb(
            int(usb_cfg["idVendor"], 16),
            int(usb_cfg["idProduct"], 16),
            usb_cfg.get("timeout", 0),
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

    raise UnsupportedConnectionModeError(
        f"connection mode '{mode}' is not one of {SUPPORTED_MODES}"
    )


def get_printer(config_path: str = CONFIG_PATH) -> Any:
    return build_printer(load_config(config_path))
