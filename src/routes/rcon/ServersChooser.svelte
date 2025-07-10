<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import * as Tabs from '$lib/components/ui/tabs/index.js'
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

<Tabs.Root value={serversManager.selectedServer?.id.toString() ?? '0'}>
	<Tabs.List>
		{#each serversManager.servers as server (server.id)}
			<Tabs.Trigger value={server.id.toString()} onclick={() => switchServer(server)}>
				<!-- TODO: is connected indicator -->
				<!-- TODO: server name if exists -->
				<span>{server.ipPort}</span>
				<!-- TODO: server fps -->
				<!-- TODO: delete button -->
			</Tabs.Trigger>
		{/each}
		<Button variant="ghost" size="icon" onclick={addBlankServer}>
			<PlusIcon />
		</Button>
	</Tabs.List>
</Tabs.Root>
