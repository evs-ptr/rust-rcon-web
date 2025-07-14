<script lang="ts">
	import '../app.css'

	import { onDestroy } from 'svelte'
	import { ModeWatcher } from 'mode-watcher'
	import Footer from './Footer.svelte'
	import Header from './Header.svelte'
	import { setServersManagerContext } from './rcon/servers-manager.svelte'
	import { setConfigStateContext } from '$lib/config-state.svelte'
	import { setConfigGlobalContext } from '$lib/config-global.svelte'

	let { children } = $props()

	setServersManagerContext()
	const configState = setConfigStateContext()
	const configGlobal = setConfigGlobalContext()

	onDestroy(() => {
		configState.destroy()
		configGlobal.destroy()
	})
</script>

<ModeWatcher />
<div class="flex min-h-screen flex-col">
	<Header />

	<main class="container mx-auto flex flex-1 flex-col overflow-clip px-2 py-4 sm:px-4 lg:px-8">
		{@render children()}
	</main>

	<Footer />
</div>

<style>
</style>
