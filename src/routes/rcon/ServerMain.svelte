<script lang="ts">
	import type { RustServer } from './rust-server.svelte'
	import ServerConnect from './ServerConnect.svelte'
	import ServerConsole from './ServerConsole.svelte'
	import ServerTabs from './ServerTabs.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()
</script>

<div class="flex flex-col gap-16">
	{#if !server.connectionWasEstablished}
		{#key server}
			<ServerConnect {server} />
		{/key}
	{:else}
		<ServerConsole {server} />
		<ServerTabs {server} />
	{/if}
</div>
