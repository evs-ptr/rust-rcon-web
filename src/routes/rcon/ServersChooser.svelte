<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import PlusIcon from '@lucide/svelte/icons/plus'
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

<div class="flex flex-row flex-wrap gap-2">
	{#each serversManager.servers as server (server.id)}
		<Button
			variant="outline"
			class={{ ring: server === serversManager.selectedServer }}
			onclick={() => switchServer(server)}
		>
			<!-- TODO: is connected indicator -->
			<!-- TODO: server name if exists -->
			<span>{server.ipPort.trim() || '_'}</span>
			<!-- TODO: server fps -->
			<!-- TODO: delete button -->
		</Button>
	{/each}
	<Button variant="outline" size="icon" onclick={addBlankServer}>
		<PlusIcon />
	</Button>
</div>
