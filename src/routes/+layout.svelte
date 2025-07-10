<script lang="ts">
	import '../app.css'

	import { ModeWatcher } from 'mode-watcher'
	import Header from './Header.svelte'
	import { setServersManagerContext } from './rcon/servers-manager.svelte'

	let { children } = $props()

	setServersManagerContext()
</script>

<ModeWatcher />
<div class="flex min-h-screen flex-col">
	<Header />

	<main class="container mx-auto flex flex-1 flex-col overflow-clip px-4 sm:px-8 lg:px-20">
		{@render children()}
	</main>

	<footer class="flex flex-col items-center justify-center py-4">
		<p>footer</p>
	</footer>
</div>

<style>
</style>
