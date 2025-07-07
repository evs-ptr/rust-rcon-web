<script lang="ts">
	import type { RustServer } from './rust-server.svelte'
	import ServerMain from './ServerMain.svelte'
	import { createServersManager } from './servers-manager.svelte'
	import ServersChooser from './ServersChooser.svelte'

	const serversManager = createServersManager()
	let selectedServer = $state<RustServer | null>(null)
</script>

<div>
	<h1>RCON</h1>
	<ServersChooser {serversManager} bind:selectedServer />
	{#if selectedServer}
		<ServerMain server={selectedServer} />
	{/if}
</div>
