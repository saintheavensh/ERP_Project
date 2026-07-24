/**
 * Localhost-only Python print agent (spec: "Network scope: Localhost only").
 * Port is fixed, not configurable — the agent (6C, printer-agent/) must bind
 * to this exact port for the FE's "Cetak" button to find it. If 6C changes
 * the port, update it here too.
 */
export const PRINTER_AGENT_URL = 'http://127.0.0.1:9100';
