<script lang="ts">
	import '../app.css'

	import { ModeWatcher } from 'mode-watcher'
	import Footer from './Footer.svelte'
	import Header from './Header.svelte'
	import { setServersManagerContext } from './rcon/servers-manager.svelte'

	let { children } = $props()

	setServersManagerContext()
</script>

<ModeWatcher />
<div class="flex min-h-screen flex-col">
	<Header />

	<main class="container mx-auto flex flex-1 flex-col overflow-clip px-4 py-4 sm:px-8 lg:px-20">
		{@render children()}
	</main>

	<Footer />
</div>

<style>
</style>
