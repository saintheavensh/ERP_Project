import { env } from '$env/dynamic/public';

/**
 * Base URL of the FlowServ API, for BROWSER-side calls.
 *
 * Must be PUBLIC_ prefixed — SvelteKit only exposes PUBLIC_* vars to the client.
 * When accessing the app from another device on the LAN, set this to the host
 * machine's IP (e.g. http://192.168.1.10:3001), NOT localhost — on a phone,
 * localhost means the phone.
 */
export const API_URL = env.PUBLIC_API_URL ?? 'http://localhost:3001';

/** Convenience: most calls want the /v1 prefix. */
export const API_BASE = `${API_URL}/v1`;
