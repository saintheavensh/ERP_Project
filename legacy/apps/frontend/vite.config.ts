import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
	plugins: [
		sveltekit(),
		visualizer({
			emitFile: true,
			filename: 'stats.html',
		}),
	],
	server: {
		host: "0.0.0.0",
		proxy: {
			'/api': {
				target: 'http://localhost:4000',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, '')
			},
			'/uploads': {
				target: 'http://localhost:4000',
				changeOrigin: true
			}
		}
	},
	ssr: {
		noExternal: ['chart.js']
	}
});
