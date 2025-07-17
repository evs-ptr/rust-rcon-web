<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import type { RustServer } from './rust-server.svelte'
	import ServerInfo from './ServerInfo.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	type Tab = 'none' | 'info' | 'chat'

	let selectedTab: Tab = $state('none')

	let existingTabs: Tab[] = ['none', 'info', 'chat']
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-row gap-2">
		{#each existingTabs as tabName (tabName)}
			<Button
				variant={selectedTab == tabName ? 'outline' : 'ghost'}
				class={[{ 'border border-transparent': selectedTab != tabName }, 'capitalize']}
				onclick={() => (selectedTab = tabName)}>{tabName}</Button
			>
		{/each}
	</div>
	{#if selectedTab == 'info'}
		<ServerInfo {server} />
	{:else if selectedTab == 'chat'}
		Chat
	{/if}
</div>
