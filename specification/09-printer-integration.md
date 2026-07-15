# Printer Integration: Devices, Multi-Size Templates & Assignment

## Two Fundamentally Different Print Mechanisms

This is the most important principle: **thermal paper (58mm/80mm) and A4 are two fundamentally different print methods**, not just different template sizes.

| | Thermal (58mm/80mm) | A4 |
|---|---|---|
| Mechanism | ESC/POS via Python Local Agent | Browser's built-in print dialog (`window.print()`) |
| Why | Browser cannot access USB/serial printers directly — needs a local bridge | Regular printers (laser/inkjet) are auto-detected via OS drivers |
| "Choose printer" | Manually configured once in Settings | Automatic — browser native |

## Architecture

```
[Transaction/Ticket Data in Database — SINGLE source of truth]
                    │
                    ▼
        [Printer Template Engine]  ← layout_config (which fields, order, style)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  [Render Thermal]        [Render A4 (HTML)]
        │                       │
        ▼                       ▼
[Python Local Agent]     [window.print() browser]
        │                       │
        ▼                       ▼
[ESC/POS Printer]        [Any OS Printer]
```

Key principle: **the render code used for PREVIEW and ACTUAL PRINT must be identical** — only the destination differs (screen vs printer).

## Template: Separate from Data

`printer_templates.layout_config` ONLY stores display configuration — which fields to show, their order, styling (bold/font size/alignment). **Never stores transaction values.** Values (price, date, customer name, etc.) are always fetched directly from the database at print/preview time.

## Detail Increases with Paper Size (Default Templates)

| | 58mm | 80mm | A4 |
|---|---|---|---|
| Header | Store name only | + address, phone | + logo, full letterhead |
| Items | Name (truncated) + qty × price | + per-line subtotal | + detailed description per item |
| Extra info | — | Cashier name | + ticket info (complaint, diagnosis, technician), T&C, signature column |
| Footer | Total only | + short note ("7-day warranty") | + full warranty policy |

## WYSIWYG Preview

- **Thermal**: rendered as monospace block with EXACT same character width as actual print (typically 32 chars/line for 58mm, 48 for 80mm)
- **A4**: preview is the EXACT SAME HTML/CSS sent to `window.print()`, displayed in an A4-proportioned container

## Document Types & Printer Assignment

Three database tables working together:

| Table | Function |
|-------|----------|
| `printer_devices` | Physical printers registered per branch (name, connection type, paper size) |
| `printer_templates` | Layout per `document_type` + `paper_size` combination |
| `printer_assignments` | For 1 branch, which `document_type` goes to which `printer_device` |

## Python Agent (Thermal Only)

| Component | Choice | Notes |
|-----------|--------|-------|
| Local server | Flask | Simpler than FastAPI for this simple use case |
| Printer library | `python-escpos` | Supports USB, Network, and Serial connections |
| Endpoint | `POST /print` | Body contains `document_type` + related data |
| Network scope | **Localhost only** | Agent must never accept connections from outside the cashier's computer |

## Distribution

1. Package agent as single executable using **PyInstaller** (`pyinstaller --onefile printer_agent.py`)
2. Set to auto-run when cashier computer starts
3. First-time setup: branch admin registers device via Printer Settings UI

## Rules for AI Agents

1. Do NOT combine thermal printer logic into the Hono backend — keep it as a separate Python service running locally.
2. A4 does NOT go through the Python agent — use `window.print()` in SvelteKit directly.
3. Render template code (preview and print) must be 1 shared function/module — do not duplicate render logic.
4. Adding a new document type = add a new row in `printer_templates` — do not create a separate system.
5. Template editor must NOT have ability to write to transaction data tables — only to `printer_templates.layout_config`.
