"""One-off: convert devices_export (1).xlsx -> devices-catalog.json.
Rich specs, NO images (imageUrl intentionally dropped per 2026-07-25 decision).
The importer reads the derived JSON, not the xlsx (xlsx npm pkg has known vulns)."""
import json, openpyxl, sys

SRC = 'devices_export (1).xlsx'
OUT = 'flowserv-api/src/db/seed/data/devices-catalog.json'

wb = openpyxl.load_workbook(SRC, read_only=True)
ws = wb.active
rows = ws.iter_rows(values_only=True)
header = [str(h).strip() if h else '' for h in next(rows)]
idx = {name: i for i, name in enumerate(header)}

def clean(v):
    if v is None:
        return ''
    # The source xlsx stored the micron sign (µ) as a bad byte -> U+FFFD.
    # Restore it so specs don't render as "1.12�m".
    return str(v).strip().replace('�', 'µ')

# Map the rich Specifications JSON -> a compact, repair-shop-useful specs object.
SPEC_MAP = [
    ('RAM/Storage', 'internal_memory'),
    ('Chipset', 'chipset'),
    ('Baterai', 'battery'),
    ('Layar', 'display_size'),
    ('Kamera', 'primary_camera'),
    ('OS', 'os'),
]

out = []
for r in rows:
    brand = clean(r[idx['Brand']])
    model = clean(r[idx['Model']])
    if not brand or not model:
        continue
    specs = {}
    raw = r[idx['Specifications']] if 'Specifications' in idx else None
    if raw:
        try:
            full = json.loads(raw)
            for label, key in SPEC_MAP:
                val = clean(full.get(key, ''))
                if val:
                    specs[label] = val
        except Exception:
            pass
    # Fallback to the flatter columns if the JSON was missing/unparseable
    if 'Chipset' not in specs and 'Chipset' in idx and clean(r[idx['Chipset']]):
        specs['Chipset'] = clean(r[idx['Chipset']])
    if 'RAM/Storage' not in specs and 'Specs' in idx and clean(r[idx['Specs']]):
        specs['RAM/Storage'] = clean(r[idx['Specs']])
    out.append({'brand': brand, 'model': model, 'imageUrl': None, 'specs': specs})

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print(f'wrote {len(out)} models -> {OUT}')
print('sample:', json.dumps(out[0], ensure_ascii=False)[:200])
