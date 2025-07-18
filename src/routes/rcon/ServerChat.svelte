<script lang="ts">
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import type { RustServer } from './rust-server.svelte'
	import { getServerChatStore, type ServerChatStore } from './server-chat.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()
	let config = getConfigGlobalContext()
	let store: ServerChatStore = $derived(getServerChatStore(server.id, config))

	$effect(() => {
		store.tryPopulateChat(server)
		store.trySubscribeToMessagesPlayerRelated(server)
	})
</script>

<div class="flex flex-col">
	{#each store.chatMessages as entry (entry.id)}
		<span>{entry.message.Message}</span>
	{/each}
</div>
