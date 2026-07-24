# FlowServ Printer Agent

A tiny local Flask service that bridges the FlowServ web app to a physical
ESC/POS thermal printer. It runs **on the cashier's own computer**, not on the
FlowServ server — the browser cannot open a USB/serial/network socket to a
receipt printer directly, so this agent is the local bridge (see
`specification/09-printer-integration.md`).

It is a separate Python service on purpose (spec rule 1: thermal ESC/POS logic
must never live in the Hono backend). It does **no layout** — every column
alignment, truncation, and "does this field even appear" decision already
happened in `flowserv-api`'s `modules/printer/render.ts` before the block
document ever reaches this agent. This agent's only job is translating each
block to the matching `python-escpos` call (`escpos_translator.py`).

A4 documents never touch this agent — those print via the browser's own
`window.print()` (spec rule 2). This agent only ever handles thermal
(58mm/80mm) receipts.

## Requirements

- Python 3.14 (confirmed working; see `requirements.txt` for pinned versions)
- No physical printer required for development — see "Testing without
  hardware" below.

## Install & run (development)

```bash
cd printer-agent
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
python printer_agent.py
```

The agent binds `127.0.0.1:9100` only — it will refuse connections from any
other machine on the network (spec: "Network scope: Localhost only"). Port
9100 is fixed to match `flowserv-web/src/lib/api/printer-agent.ts`'s
`PRINTER_AGENT_URL` — if you ever change the port here, change it there too.

Verify it's alive:

```bash
curl http://127.0.0.1:9100/health
# {"status":"ok"}
```

## Configuring the physical printer

Copy `config.example.json` to `config.json` (git-ignored — every cashier
computer keeps its own) and fill in the real connection details for the
printer attached to *that* machine:

| `mode` | When to use | Config key |
|---|---|---|
| `usb` | Printer connected via USB | `usb.idVendor` / `usb.idProduct` (hex, from Device Manager / `lsusb`) |
| `network` | Network/WiFi printer | `network.host` / `network.port` |
| `serial` | Serial/COM port printer | `serial.devfile` (e.g. `COM3`) / `serial.baudrate` |
| `file` | No physical printer — writes raw ESC/POS bytes to a file you can inspect | `file.path` |
| `dummy` | No physical printer, no output at all (the default with no `config.json`) | — |

With no `config.json` present, the agent defaults to `dummy` — every request
succeeds and produces no output. This is intentional: it's what lets the rest
of the FlowServ printing feature (settings UI, preview, "Kirim ke Printer"
button) be developed and demoed with zero printer hardware anywhere.

## Testing without hardware

`python-escpos` ships a `Dummy` backend (accumulates bytes in memory) and a
`File` backend (writes bytes to a file) specifically for this. The test suite
uses `Dummy` exclusively — no printer, no USB drivers, no network device
needed to run it:

```bash
python -m pytest tests/ -v
```

To inspect what a *real* printer would have received, byte-for-byte, without
owning one: set `config.json`'s `mode` to `file`, print something through the
normal flow, then read the resulting `.bin` file. Every ESC/POS command in it
(bold on/off `\x1bE`, align `\x1ba`, cut `\x1dV`, ...) is the exact sequence a
real 58/80mm printer would execute.

## Physical print checklist (run this once real hardware is available)

Nothing above requires a printer, but the feature isn't proven end-to-end
until it has actually cut paper. When a real 58mm or 80mm ESC/POS printer is
available:

1. Set `config.json`'s `mode` to `usb`/`network`/`serial` as appropriate, with
   the real connection details.
2. Restart the agent (`python printer_agent.py`).
3. From the FlowServ web app, open a POS invoice → "Cetak Struk" → "Kirim ke
   Printer".
4. Confirm: text is legible and correctly aligned (left/center/right), the
   store name is bold, the total line is bold, column spacing lines up (no
   overlap between the left/right sides of a row), and the printer actually
   cuts the paper after the receipt.
5. If alignment/truncation looks wrong: the bug is in
   `flowserv-api/src/modules/printer/render.ts` (the one place layout is
   decided), not in this agent — this agent only relays bytes.

## Packaging (PyInstaller)

Ship the agent as a single executable so a non-technical cashier can
double-click it (or register it to auto-run at boot) with no Python install:

```bash
python -m PyInstaller --onefile --name printer-agent --collect-data escpos printer_agent.py
```

`--collect-data escpos` is required — `python-escpos` loads a bundled
`capabilities.json` data file at runtime that PyInstaller does not detect
automatically since it's data, not code. Without this flag the packaged exe
answers `/health` but fails every `/print` call with a "No such file or
directory: .../escpos/capabilities.json" error (found and fixed while
verifying this build).

The built executable is at `dist/printer-agent.exe`. Verified: it starts,
answers `GET /health`, and successfully "prints" (Dummy backend) a real
`POST /print` payload with no Python installation on the machine running it.

For auto-start on boot: place a shortcut to `printer-agent.exe` in the
Windows Startup folder (`shell:startup`), or register it as a scheduled task
that runs at logon.

## Architecture notes

- `printer_agent.py` — the Flask app: `GET /health`, `POST /print`. Binds
  `127.0.0.1` only.
- `escpos_translator.py` — pure `blocks_to_escpos(printer, blocks, width)`.
  One branch per block type (`text`/`line`/`row`/`total`/`cut`). No layout
  decisions — see the module docstring.
- `connection.py` — factory that builds the right `python-escpos` printer
  instance (`Usb`/`Network`/`Serial`/`File`/`Dummy`) from `config.json`. The
  `device` field in the FE's request body (`deviceId`/`deviceName`/
  `connectionType` from the tenant database) is informational only — the
  actual physical connection this specific agent drives is always the local
  `config.json`, never trusted from the network request.
- `tests/` — `test_translator.py` (byte-level, against `Dummy`),
  `test_connection.py` (factory selection, mocked USB/Network/Serial),
  `test_agent.py` (Flask endpoint behavior).
