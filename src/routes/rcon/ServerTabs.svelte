<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import type { RustServer } from './rust-server.svelte'
	import ServerChat from './ServerChat.svelte'
	import ServerInfo from './ServerInfo.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	let existingTabs: (typeof server.configServer.selectedTab)[] = ['none', 'info', 'chat']
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-row gap-2">
		{#each existingTabs as tabName (tabName)}
			<Button
				variant={server.configServer.selectedTab == tabName ? 'outline' : 'ghost'}
				class={[{ 'border border-transparent': server.configServer.selectedTab != tabName }, 'capitalize']}
				onclick={() => (server.configServer.selectedTab = tabName)}
			>
				{tabName}
			</Button>
		{/each}
	</div>
	{#if server.configServer.selectedTab == 'info'}
		<ServerInfo {server} />
	{:else if server.configServer.selectedTab == 'chat'}
		<ServerChat {server} />
	{/if}
</div>
