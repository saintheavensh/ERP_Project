"""
Block -> ESC/POS translator (plan 6C.2, decision D1).

The backend (flowserv-api modules/printer/render.ts) is the ONLY place that
makes layout decisions -- column alignment, truncation, which fields appear.
This module does zero layout: it takes the already-shaped ThermalBlock list
and emits the matching python-escpos calls, one branch per block type. It
must stay this dumb; if a new alignment rule is ever needed, it belongs in
render.ts, not here.

Block shapes (mirrors flowserv-api/src/modules/printer/types.ts ThermalBlock):
  {"type": "text",  "value": str, "align": "left"|"center"|"right", "bold"?: bool}
  {"type": "line"}
  {"type": "row",   "value": str, "bold"?: bool}
  {"type": "total", "value": str}
  {"type": "cut"}
"""

from __future__ import annotations

from typing import Any

# Mirrors flowserv-api/src/modules/printer/render.ts THERMAL_CHAR_WIDTH.
THERMAL_CHAR_WIDTH: dict[str, int] = {
    "58mm": 32,
    "80mm": 48,
}


class UnknownBlockTypeError(ValueError):
    """Raised when a block carries a `type` this agent doesn't know how to print."""


def pad_row(left: str, right: str, width: int) -> str:
    """Right-align `right` within `width`, left-align `left` in the remaining
    space -- mirrors flowserv-api's modules/printer/render.ts padRow() so a
    diagnostic test-print row lines up exactly like a real receipt's would.
    Used only by build_test_print_blocks() below; real receipts already
    arrive with this padding done server-side (decision D1)."""
    r = right[:width] if len(right) > width else right
    max_left = max(0, width - len(r) - 1)
    l = left[:max_left] if len(left) > max_left else left
    gap = max(1, width - len(l) - len(r))
    return l + (" " * gap) + r


def build_test_print_blocks(width: int, config_description: str, timestamp: str) -> list[dict]:
    """A generic diagnostic receipt -- no transaction data, no template --
    that exercises every ThermalBlock type this agent understands (text at
    each alignment, a line, a padded row, a bold total, cut). Printing this
    successfully proves the full pipeline (agent -> connection -> physical
    device) works for whatever printer THIS machine's config.json currently
    points at, independent of any real invoice."""
    return [
        {"type": "text", "value": "TES CETAK / TEST PRINT", "align": "center", "bold": True},
        {"type": "line"},
        {"type": "text", "value": f"Waktu: {timestamp}", "align": "left"},
        {"type": "text", "value": f"Konfigurasi: {config_description}", "align": "left"},
        {"type": "line"},
        {"type": "text", "value": "Rata Kiri", "align": "left"},
        {"type": "text", "value": "Rata Tengah", "align": "center"},
        {"type": "text", "value": "Rata Kanan", "align": "right"},
        {"type": "line"},
        {"type": "row", "value": pad_row("Kolom Kiri", "Kolom Kanan", width)},
        {"type": "total", "value": pad_row("CONTOH TOTAL", "100.000", width)},
        {"type": "line"},
        {"type": "text", "value": "Jika teks di atas rapi dan", "align": "center"},
        {"type": "text", "value": "kertas ini benar tercetak,", "align": "center"},
        {"type": "text", "value": "printer sudah terhubung dengan benar.", "align": "center"},
        {"type": "cut"},
    ]


def blocks_to_escpos(printer: Any, blocks: list[dict], width: int) -> None:
    """Write `blocks` to `printer` (any python-escpos Escpos subclass, including
    Dummy/File for hardware-free testing). Raises UnknownBlockTypeError on a
    block type this agent has never seen -- fail loudly rather than silently
    dropping a line of a real receipt.
    """
    for block in blocks:
        block_type = block.get("type")

        if block_type == "text":
            printer.set(align=block.get("align", "left"), bold=bool(block.get("bold", False)))
            printer.text(f"{block['value']}\n")

        elif block_type == "line":
            printer.set(align="left", bold=False)
            printer.text(("-" * width) + "\n")

        elif block_type == "row":
            printer.set(align="left", bold=bool(block.get("bold", False)))
            printer.text(f"{block['value']}\n")

        elif block_type == "total":
            # Always bold, matching ThermalPreview.svelte's `font-bold` on
            # every 'total' block -- there's no `bold` field on this block
            # type because it's never optional.
            printer.set(align="left", bold=True)
            printer.text(f"{block['value']}\n")

        elif block_type == "cut":
            printer.cut()

        else:
            raise UnknownBlockTypeError(f"unknown block type: {block_type!r}")
