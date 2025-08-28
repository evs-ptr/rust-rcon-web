<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
	import * as Tooltip from '$lib/components/ui/tooltip/index.js'
	import PlusIcon from '@lucide/svelte/icons/plus'
	import XIcon from '@lucide/svelte/icons/x'
	import type { RustServer } from './rust-server.svelte'
	import { ServersManager } from './servers-manager.svelte'

	interface Props {
		serversManager: ServersManager
	}

	let { serversManager }: Props = $props()

	function addBlankServer() {
		const newServer = serversManager.addBlankServer()
		switchServer(newServer)
	}

	function switchServer(server: RustServer) {
		serversManager.selectServer(server)
	}

	function deleteServer(server: RustServer) {
		serversManager.deleteServer(server)
	}
</script>

<div class="flex flex-row flex-wrap gap-2">
	{#each serversManager.servers as server (server.id)}
		<div class="flex items-center">
			<Button
				variant={server === serversManager.selectedServer ? 'outline' : 'ghost'}
				class={{
					'rounded-r-none': true,
					'border border-transparent': server !== serversManager.selectedServer,
				}}
				onclick={() => switchServer(server)}
			>
				<!-- TODO: is connected indicator -->
				<!-- TODO: server name if exists -->
				<span>{server.displayName}</span>
				<!-- TODO: server fps -->
			</Button>

			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger
						class={[
							buttonVariants({
								variant: server === serversManager.selectedServer ? 'outline' : 'ghost',
								size: 'icon',
							}),
							'hover:text-destructive rounded-l-none border-l-0',
							{
								'border border-transparent': server !== serversManager.selectedServer,
							},
						]}
						onclick={() => deleteServer(server)}
					>
						<XIcon />
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Delete server</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>
	{/each}
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon' })} onclick={addBlankServer}>
				<PlusIcon />
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>Add new server</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
</div>
