// Phase 11 — `adapter-auto` diganti `adapter-node`.
//
// adapter-auto menebak lingkungannya (Vercel/Netlify/Cloudflare) dan, saat tak
// mengenali apa pun, TIDAK menghasilkan server yang bisa dijalankan. VPS sendiri
// bukan salah satu yang ia kenali. adapter-node menghasilkan `build/index.js`
// biasa yang tinggal dijalankan `node build` — persis yang dibutuhkan di dalam
// kontainer.
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	]
});
