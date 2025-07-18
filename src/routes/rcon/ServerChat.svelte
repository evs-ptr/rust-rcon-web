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
</script>

<div class="flex flex-col">
	{#each store.chatMessages as msg (msg.id)}
		<span>{msg.message}</span>
	{/each}
</div>
