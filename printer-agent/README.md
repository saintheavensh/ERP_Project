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

**This is NOT started by the root `npm run dev`.** That command (root
`package.json`) only starts `flowserv-api` and `flowserv-web` via
`concurrently` — this agent is a separate Python process on purpose (spec
rule 1) and must be started on its own, on whichever computer has the
physical printer attached. See "Install & run" below.

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
| `win32` | **Recommended for Windows.** Prints through the printer's own installed Windows driver via the print spooler — no vendor/product ID lookup at all. | `win32.printerName` (see "Scan and pick" below) |
| `usb` | Printer connected via USB with no Windows driver installed (raw ESC/POS over libusb) | `usb.idVendor` / `usb.idProduct` (hex, from Device Manager) |
| `network` | Network/WiFi printer | `network.host` / `network.port` |
| `serial` | Serial/COM port printer | `serial.devfile` (e.g. `COM3`) / `serial.baudrate` |
| `file` | No physical printer — writes raw ESC/POS bytes to a file you can inspect | `file.path` |
| `dummy` | No physical printer, no output at all (the default with no `config.json`) | — |

With no `config.json` present, the agent defaults to `dummy` — every request
succeeds and produces no output. This is intentional: it's what lets the rest
of the FlowServ printing feature (settings UI, preview, "Kirim ke Printer"
button) be developed and demoed with zero printer hardware anywhere.

### Scan and pick (win32 mode) — no manual address needed

Most receipt printers register themselves as a normal Windows printer queue
the moment their driver is installed (Settings → Printers & Scanners) — even
though they're thermal/ESC-POS, not GDI printers. `win32` mode uses exactly
that queue via python-escpos's `Win32Raw` (raw bytes through the spooler),
which means the agent can just **ask Windows what's installed** instead of
requiring a USB vendor/product ID or IP address to be typed in by hand:

```bash
curl http://127.0.0.1:9100/printers
# {"data":[
#   {"name":"POS-80","driver":"POS-80 11.3.0.0","port":"USB001","isDefault":true,"recommended":true},
#   {"name":"Microsoft Print to PDF","driver":"Microsoft Print To PDF","port":"PORTPROMPT:","isDefault":false,"recommended":false}
# ]}
```

`recommended` is only a sort hint (driver-name keyword match, e.g. "POS"/
"Epson"/"thermal", or a non-virtual port) — every installed printer is always
listed, nothing is filtered out, and the choice is always explicit.

The FlowServ Settings UI (`PrinterTab.svelte` → "Pindai Printer di Komputer
Ini") calls this endpoint and lets the admin pick from the list, then POSTs
the choice straight to this agent so it's remembered immediately:

```bash
curl -X POST http://127.0.0.1:9100/config -H "Content-Type: application/json" \
  -d '{"mode":"win32","win32":{"printerName":"POS-80"}}'
# {"status":"saved"}
```

No `config.json` editing required — `GET /config` reads the current choice,
`POST /config` validates (rejects an unsupported `mode` or a config that
fails to build a printer instance) and writes it. This is a **local, own-
machine** setting — it never touches the multi-tenant `printer_devices` table
in the main app's database. The device row in Settings still records which
physical printer *should* be used for a branch/document type; this endpoint
is what makes the *specific cashier computer* actually reach it, with the
address filled in by picking from a list instead of typing one.

### Test print — "is this printer actually integrated correctly?"

`POST /test-print` prints a generic diagnostic receipt through whichever
printer `config.json` currently points at — no real invoice needed. It
exercises every block type a real receipt uses (bold header, left/center/
right text, a line, a column-aligned row, a bold total, cut), so a
successful test print is real evidence the whole pipeline (agent →
connection → physical device) works, not a weaker, separate check:

```bash
curl -X POST http://127.0.0.1:9100/test-print -H "Content-Type: application/json" \
  -d '{"paperSize":"80mm"}'
# {"status":"printed","mode":"win32"}
```

The Settings UI exposes this two ways: a "Test Cetak" link right after
picking a printer in `PrinterScanPicker.svelte` (immediate feedback that the
pick actually works), and a "Test Cetak" button per row in the printer
devices table (`PrinterTab.svelte`) so an already-configured printer can be
re-verified any time — after moving cables, restarting the agent, or just
doubting last week's setup.

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

**`config.json` must sit in the same folder as `printer-agent.exe` itself**
(copy `config.example.json` there, or let the Settings UI's "scan and pick"
write it via `POST /config`). A PyInstaller `--onefile` exe extracts itself
into a fresh temp directory on every launch and deletes it on exit — Python's
`__file__` inside that bundle resolves to a path *inside* that ephemeral temp
dir, not next to the real `.exe`. Using `__file__` unconditionally here would
mean `config.json` (this agent's whole reason to exist — persisting the
cashier's printer choice) silently reset to `dummy` on every single run of
the packaged exe, and every `POST /config` write would vanish the instant the
process exited. `connection.py`'s `_resolve_base_dir()` checks `sys.frozen`
(how PyInstaller signals "running from a bundle") and resolves next to
`sys.executable` instead in that case — found and fixed while verifying this
build; regression-tested in `test_connection.py`. Wherever you move
`printer-agent.exe` (Desktop, Startup folder, etc.), take `config.json` with
it, in the same folder.

For auto-start on boot: place a shortcut to `printer-agent.exe` in the
Windows Startup folder (`shell:startup`), or register it as a scheduled task
that runs at logon.

### Quick toggle for local development

`start-agent.bat` / `stop-agent.bat` (this folder) start/stop the packaged
`dist\printer-agent.exe` on demand — double-click whichever one you need.
These are **manual only, not autorun**: nothing is registered with Windows
Startup or Task Scheduler, so the agent only runs when you explicitly start
it. This is deliberately separate from the "auto-start on boot" note above,
which is for a real cashier machine's permanent setup, not a dev box —
during FlowServ development you usually want the printer agent off unless
you're actively testing "Kirim ke Printer" / test-print, so the toggle is a
plain start/stop, not a background service.

- `start-agent.bat` — no-ops with "already running" if it's already up;
  otherwise launches the exe minimized and confirms `GET /health`.
- `stop-agent.bat` — kills every `printer-agent.exe` process (the
  `--onefile` build runs a bootloader + child process, both sharing this
  image name).

Requires `dist\printer-agent.exe` to already be built (see "Packaging"
above) — `start-agent.bat` tells you the exact command if it's missing.

## Architecture notes

- `printer_agent.py` — the Flask app: `GET /health`, `POST /print`,
  `GET /printers` (scan), `GET`/`POST /config` (read/persist the local
  connection choice). Binds `127.0.0.1` only.
- `escpos_translator.py` — pure `blocks_to_escpos(printer, blocks, width)`.
  One branch per block type (`text`/`line`/`row`/`total`/`cut`). No layout
  decisions — see the module docstring.
- `connection.py` — factory that builds the right `python-escpos` printer
  instance (`Win32Raw`/`Usb`/`Network`/`Serial`/`File`/`Dummy`) from
  `config.json`, plus `scan_windows_printers()` (enumerates installed Windows
  printer queues via `pywin32` for the "scan and pick" flow) and
  `save_config()`/`load_config()`. The `device` field in the FE's `/print`
  request body (`deviceId`/`deviceName`/`connectionType` from the tenant
  database) is informational only — the actual physical connection this
  specific agent drives is always the local `config.json`, never trusted from
  the network request.
- `tests/` — `test_translator.py` (byte-level, against `Dummy`),
  `test_connection.py` (factory selection incl. `win32`, mocked
  USB/Network/Serial/`win32print`, config save/load round-trip),
  `test_agent.py` (Flask endpoint behavior incl. `/printers` and `/config`).
