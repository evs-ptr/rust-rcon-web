<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
	import type { CommandResponse } from './rust-rcon'
	import type { RustServer } from './rust-server.svelte'
	import { serverConsoleStore } from './server-console.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	const SUBSCRIBE_ID = 'cnsle'
	let unsubscribe: (() => void) | null = null

	function onMessage(msg: CommandResponse) {
		console.log(msg)
		serverConsoleStore.messages.push(msg.Message)
	}

	onMount(() => {
		unsubscribe?.()
		unsubscribe = server.subscribeOnMessage(SUBSCRIBE_ID, onMessage)
		server.sendCommand('console.tail 100')
		server.sendCommand('console.tail 100')
		server.sendCommand('console.tail 100')
		server.sendCommand('console.tail 100')
		server.sendCommand('c.help')
	})

	onDestroy(() => {
		unsubscribe?.()
	})
</script>

<div>
	<div class="flex h-96 flex-col gap-2 overflow-x-scroll font-mono text-xs">
		{#each serverConsoleStore.messages as message}
			<div>
				<span class="overflow-x-scroll text-nowrap">{message}</span>
			</div>
		{/each}
	</div>
</div>
