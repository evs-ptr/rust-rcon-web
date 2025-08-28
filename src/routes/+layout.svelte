<script lang="ts">
	import '../app.css'

	import { setConfigGlobalContext } from '$lib/config-global.svelte'
	import { setConfigStateContext } from '$lib/config-state.svelte'
	import { ModeWatcher } from 'mode-watcher'
	import { onDestroy } from 'svelte'
	import Footer from './Footer.svelte'
	import Header from './Header.svelte'
	import { setServersManagerContext } from './rcon/servers-manager.svelte'

	let { children } = $props()

	const configState = setConfigStateContext()
	const configGlobal = setConfigGlobalContext()
	const serversManager = setServersManagerContext(configState)

	onDestroy(() => {
		serversManager.destroy()
		configGlobal.destroy()
		configState.destroy()
	})
</script>

<ModeWatcher />
<div class="flex min-h-screen flex-col">
	<Header />

	<main class="container mx-auto flex flex-1 flex-col overflow-clip px-4 py-4 sm:px-6 lg:px-8">
		{@render children()}
	</main>

	<Footer />
</div>

<style>
</style>
