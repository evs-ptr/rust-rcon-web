<script lang="ts">
	import type { RustServer } from './rust-server'
	import { createServersManager } from './servers-manager.svelte'

	interface Props {
		serversManager: ReturnType<typeof createServersManager>
		selectedServer: RustServer | null
	}

	const { serversManager, selectedServer = $bindable() }: Props = $props()

	function addBlankServer() {
		const newServer = serversManager.addServer()
		newServer.ipPort = '127.0.0.1:24247'
		newServer.password = '123456'
	}
</script>

<div class="flex flex-row gap-2">
	{#each serversManager.servers as server (server.id)}
		<div>
			<span>{server.ipPort}</span>
		</div>
	{/each}
	<button onclick={addBlankServer}> Add Server </button>
</div>
