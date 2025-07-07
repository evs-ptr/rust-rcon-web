<script lang="ts">
	import { onMount } from 'svelte'
	import type { RustServer } from './rust-server.svelte'
	import ServerMain from './ServerMain.svelte'
	import { createServersManager } from './servers-manager.svelte'
	import ServersChooser from './ServersChooser.svelte'

	const serversManager = createServersManager()
	let selectedServer = $state<RustServer | null>(null)

	onMount(() => {
		// TODO: for testing, remove this
		const server = serversManager.addServer()
		server.ipPort = '127.0.0.1:24247'
		server.password = '1jEIXkbSQty3'
		selectedServer = server
	})
</script>

<div>
	<h1>RCON</h1>
	<ServersChooser {serversManager} bind:selectedServer />
	{#if selectedServer}
		<ServerMain server={selectedServer} />
	{/if}
</div>
