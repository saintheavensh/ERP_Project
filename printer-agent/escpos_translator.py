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
