<script lang="ts">
	import type { RustServer } from './rust-server.svelte'
	import { ServersManager } from './servers-manager.svelte'

	interface Props {
		serversManager: ServersManager
	}

	let { serversManager }: Props = $props()

	function addBlankServer() {
		const newServer = serversManager.addServer()
		newServer.ipPort = '127.0.0.1:'
		switchServer(newServer)
	}

	function switchServer(server: RustServer) {
		serversManager.selectedServer = server
	}
</script>

<div class="flex flex-row gap-2">
	{#each serversManager.servers as server (server.id)}
		<button onclick={() => switchServer(server)}>
			<!-- TODO: is connected indicator -->
			<!-- TODO: server name if exists -->
			<span>{server.ipPort}</span>
			<!-- TODO: server fps -->
			<!-- TODO: delete button -->
		</button>
	{/each}
	<button onclick={addBlankServer}>Add Server</button>
</div>
