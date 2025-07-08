<script lang="ts">
	import type { RustServer } from './rust-server.svelte'
	import ServerConnect from './ServerConnect.svelte'
	import ServerConsole from './ServerConsole.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()
</script>

<div class="flex flex-col gap-2">
	<h2>Server: {server.ipPort}</h2>
	{#if !server.connectionWasEstablished}
		<ServerConnect {server} />
	{:else}
		<ServerConsole {server} />
	{/if}
</div>
