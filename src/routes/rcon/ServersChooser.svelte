<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import PlusIcon from '@lucide/svelte/icons/plus'
	import XIcon from '@lucide/svelte/icons/x'
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

	function deleteServer(server: RustServer) {
		serversManager.deleteServer(server)
	}
</script>

<div class="flex flex-row flex-wrap gap-2">
	{#each serversManager.servers as server (server.id)}
		<div class="flex items-center">
			<Button
				variant="outline"
				class={{
					'ring-primary/40 ring': server === serversManager.selectedServer,
					'rounded-r-none': true,
				}}
				onclick={() => switchServer(server)}
			>
				<!-- TODO: is connected indicator -->
				<!-- TODO: server name if exists -->
				<span>{server.ipPort.trim() || '_'}</span>
				<!-- TODO: server fps -->
			</Button>
			<Button
				variant="outline"
				size="icon"
				class={{
					'hover:text-destructive rounded-l-none border-l-0': true,
					'ring-primary/40 ring': server === serversManager.selectedServer,
				}}
				onclick={() => deleteServer(server)}
			>
				<XIcon />
			</Button>
		</div>
	{/each}
	<Button variant="outline" size="icon" onclick={addBlankServer}>
		<PlusIcon />
	</Button>
</div>
