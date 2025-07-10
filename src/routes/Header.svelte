<script lang="ts">
	import { page } from '$app/state'
	import { Button } from '$lib/components/ui/button/index.js'
	import MoonIcon from '@lucide/svelte/icons/moon'
	import SunIcon from '@lucide/svelte/icons/sun'
	import { toggleMode } from 'mode-watcher'
</script>

<header>
	<nav class="flex flex-row justify-between px-4 py-2">
		<div class="flex flex-row gap-2">
			<Button
				href="/"
				variant={page.url.pathname === '/' ? 'outline' : 'ghost'}
				class={page.url.pathname !== '/' ? 'border border-transparent' : ''}
			>
				Home
			</Button>
			<Button
				href="/rcon"
				variant={page.url.pathname.startsWith('/rcon') ? 'outline' : 'ghost'}
				class={!page.url.pathname.startsWith('/rcon') ? 'border border-transparent' : ''}
			>
				RCON
			</Button>
		</div>
		<div>
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
	</nav>
</header>

<style>
</style>
