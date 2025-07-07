<script lang="ts">
	import type { RustServer } from './rust-server.svelte'
	import { createServersManager } from './servers-manager.svelte'

	interface Props {
		serversManager: ReturnType<typeof createServersManager>
		selectedServer: RustServer | null
	}

	let { serversManager, selectedServer = $bindable() }: Props = $props()

	function addBlankServer() {
		const newServer = serversManager.addServer()
		newServer.ipPort = `127.0.0.1:${Math.floor(Math.random() * 10000)}`
		newServer.password = '123456'
	}

	function switchServer(server: RustServer) {
		selectedServer = server
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
	<button onclick={addBlankServer}> Add Server </button>
</div>
