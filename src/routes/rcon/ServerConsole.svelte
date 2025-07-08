<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
	import type { CommandResponse } from './rust-rcon'
	import type { RustServer } from './rust-server.svelte'
	import { serverConsoleStore as store } from './server-console.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	const SUBSCRIBE_ID = 'cnsle'
	let unsubscribe: (() => void) | null = null

	function onMessage(msg: CommandResponse) {
		console.log(msg)
		store.messages.push(msg.Message)
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

	function handleSubmit() {
		if (store.commandInput.trim() === '') {
			return
		}
		server.sendCommand(store.commandInput)
		store.commandInput = ''
	}
</script>

<div>
	<div class="flex h-96 flex-col gap-2 overflow-x-scroll font-mono text-xs">
		{#each store.messages as message}
			<div>
				<span class="overflow-x-scroll text-nowrap">{message}</span>
			</div>
		{/each}
	</div>
	<div>
		<form onsubmit={handleSubmit} class="flex gap-2">
			<input
				type="text"
				bind:value={store.commandInput}
				class="flex-grow rounded border bg-transparent p-2"
			/>
			<button type="submit">Send</button>
		</form>
	</div>
</div>
