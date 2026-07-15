import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
    },
    resolve: {
        alias: {
            '@shared': path.resolve(__dirname, './src/shared'),
            '@domain': path.resolve(__dirname, './src/modules/02-inventory/inventory/domain'),
            '@application': path.resolve(__dirname, './src/modules/02-inventory/inventory/application'),
        },
    },
});
