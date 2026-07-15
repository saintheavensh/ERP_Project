import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
    plugins: [svelte({ hot: !process.env.VITEST })],
    test: {
        include: ['tests/unit/**/*.{test,spec}.{js,ts}', 'tests/integration/**/*.{test,spec}.{js,ts}'],
        environment: 'jsdom',
        environmentOptions: {
            jsdom: {
                url: 'http://localhost'
            }
        },
        setupFiles: ['tests/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['**/*.config.ts', '**/*.d.ts', '**/types/**']
        }
    },
    resolve: {
        alias: {
            $lib: path.resolve('./src/lib'),
            '$app/environment': path.resolve('./tests/mocks/app/environment.ts'),
            '$app/navigation': path.resolve('./tests/mocks/app/navigation.ts')
        }
    }
});
