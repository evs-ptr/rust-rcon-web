<script lang="ts">
	import { page } from '$app/state'
	import SettingsMenu from '$lib/components/settings/SettingsMenu.svelte'
	import { Button } from '$lib/components/ui/button/index.js'
	import MoonIcon from '@lucide/svelte/icons/moon'
	import SunIcon from '@lucide/svelte/icons/sun'
	import { toggleMode } from 'mode-watcher'
</script>

<header class="sticky top-0 backdrop-blur-md">
	<div class="flex flex-row justify-between px-2 py-2 sm:px-4 lg:px-8">
		<nav class="flex flex-row gap-2">
			<Button
				href="/"
				variant={page.url.pathname === '/' ? 'outline' : 'ghost'}
				class={{ 'border border-transparent': page.url.pathname !== '/' }}
			>
				Home
			</Button>
			<Button
				href="/rcon"
				variant={page.url.pathname.startsWith('/rcon') ? 'outline' : 'ghost'}
				class={{ 'border border-transparent': !page.url.pathname.startsWith('/rcon') }}
			>
				RCon
			</Button>
		</nav>
		<div class="flex flex-row gap-2">
			<SettingsMenu />
			<Button onclick={toggleMode} variant="outline" size="icon">
				<SunIcon
					class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90"
				/>
				<MoonIcon
					class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
		</div>
	</div>
</header>

<style>
</style>
