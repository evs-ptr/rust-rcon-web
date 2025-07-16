/// <reference types="vitest" />
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig as defineViteConfig, mergeConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { defineConfig as defineVitestConfig } from 'vitest/config'

const viteConfig = defineViteConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
})

const vitestConfig = defineVitestConfig({
	test: {
		projects: [
			{
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }],
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts'],
				},
			},
			{
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
				},
			},
		],
	},
})

export default mergeConfig(viteConfig, vitestConfig)
