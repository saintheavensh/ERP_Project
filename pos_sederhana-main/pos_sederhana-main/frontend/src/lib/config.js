/**
 * POS New Majmu - Configuration Service
 * Handles smart switching between Local (LAN/Wi-Fi) and Online (Tunnel) mode.
 */

const getBaseConfig = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const isLocal = 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') || 
        hostname.startsWith('172.') || 
        hostname.startsWith('10.') || 
        hostname.endsWith('.local');

    // Default Ports
    const HONO_PORT = 3000;
    const PRINT_PORT = 8080;

    if (isLocal) {
        // If accessed via local IP/Hostname, hit the ports directly
        return {
            apiBase: `${protocol}//${hostname}:${HONO_PORT}`,
            printBase: `${protocol}//${hostname}:${PRINT_PORT}`,
            mode: 'LOCAL'
        };
    } else {
        // Mode Online (Uji Coba Gratis)
        return {
            apiBase: `https://life-activation-commonwealth-evans.trycloudflare.com`,
            printBase: `https://accessory-processor-retained-roberts.trycloudflare.com`, // Jalur printer via Proxy Vite
            mode: 'ONLINE'
        };
    }
};

export const config = getBaseConfig();
