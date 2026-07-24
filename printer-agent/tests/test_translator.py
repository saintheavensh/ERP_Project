"""
6C.2 DoD: pytest against python-escpos's Dummy backend, asserting the emitted
ESC/POS byte sequence per block type. Dummy needs no physical printer --
`Dummy().output` accumulates every byte that would have been sent to a real
device, so assertions here are exactly as meaningful as they'd be against
hardware.

Byte sequences asserted are the standard ESC/POS protocol codes (ESC/POS is a
public spec, not a python-escpos implementation detail):
  ESC E 1 / ESC E 0  -> bold on/off      (0x1b 0x45 0x01 / 0x00)
  ESC a 0/1/2        -> align left/center/right (0x1b 0x61 0x00/0x01/0x02)
  GS V               -> paper cut        (0x1d 0x56 ...)
"""

import sys
from pathlib import Path

import pytest
from escpos.printer import Dummy

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from escpos_translator import UnknownBlockTypeError, blocks_to_escpos  # noqa: E402

BOLD_ON = b"\x1bE\x01"
BOLD_OFF = b"\x1bE\x00"
ALIGN_LEFT = b"\x1ba\x00"
ALIGN_CENTER = b"\x1ba\x01"
ALIGN_RIGHT = b"\x1ba\x02"
CUT = b"\x1dV"


def render(blocks: list[dict], width: int = 32) -> bytes:
    printer = Dummy()
    blocks_to_escpos(printer, blocks, width)
    return printer.output


def test_text_block_centered_bold_contains_store_name():
    out = render([{"type": "text", "value": "TOKO SERVIS JAYA", "align": "center", "bold": True}])
    assert ALIGN_CENTER in out
    assert BOLD_ON in out
    assert b"TOKO SERVIS JAYA\n" in out


def test_text_block_plain_left_not_bold():
    out = render([{"type": "text", "value": "INV-001", "align": "left"}])
    assert ALIGN_LEFT in out
    assert BOLD_ON not in out
    assert b"INV-001\n" in out


def test_line_block_emits_dashes_at_exact_width():
    out = render([{"type": "line"}], width=32)
    assert (b"-" * 32 + b"\n") in out
    out_80 = render([{"type": "line"}], width=48)
    assert (b"-" * 48 + b"\n") in out_80


def test_row_block_prints_prealigned_value_verbatim():
    # Row values arrive already column-padded by the TS render engine --
    # this agent must never recompute spacing, only print the string as-is.
    padded = "LCD iPhone 11" + " " * 10 + "350.000"
    out = render([{"type": "row", "value": padded}])
    assert (padded + "\n").encode() in out
    assert ALIGN_LEFT in out


def test_row_block_bold_when_flagged():
    out = render([{"type": "row", "value": "Diskon        -10.000", "bold": True}])
    assert BOLD_ON in out


def test_total_block_is_always_bold_left_aligned():
    out = render([{"type": "total", "value": "TOTAL         350.000"}])
    assert BOLD_ON in out
    assert ALIGN_LEFT in out
    assert b"TOTAL         350.000\n" in out


def test_cut_block_emits_cut_command():
    out = render([{"type": "cut"}])
    assert CUT in out


def test_full_receipt_sequence_matches_expected_block_order():
    blocks = [
        {"type": "text", "value": "TOKO SERVIS JAYA", "align": "center", "bold": True},
        {"type": "line"},
        {"type": "text", "value": "INV-20260724-001", "align": "left"},
        {"type": "row", "value": "LCD iPhone 11    1x  350.000"},
        {"type": "line"},
        {"type": "total", "value": "TOTAL            350.000"},
        {"type": "cut"},
    ]
    out = render(blocks, width=32)
    # Every block contributed its text, in order, to a single output stream.
    assert out.index(b"TOKO SERVIS JAYA") < out.index(b"INV-20260724-001")
    assert out.index(b"INV-20260724-001") < out.index(b"LCD iPhone 11")
    assert out.index(b"LCD iPhone 11") < out.index(b"TOTAL")
    assert out.index(b"TOTAL") < out.index(CUT)


def test_unknown_block_type_raises_instead_of_silently_dropping():
    with pytest.raises(UnknownBlockTypeError):
        render([{"type": "qr", "value": "not-yet-supported"}])
