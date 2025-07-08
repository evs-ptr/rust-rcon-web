<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
	import type { CommandResponse } from './rust-rcon'
	import type { RustServer } from './rust-server.svelte'
	import { getServerConsoleStore, type ServerConsoleStore } from './server-console.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()
	const store: ServerConsoleStore = getServerConsoleStore(server.id)

	const SUBSCRIBE_ID = 'cnsle'
	let unsubscribe: (() => void) | null = null

	let consoleContainer: HTMLDivElement | undefined
	const SCROLL_THRESHOLD = 16 * 2.5
	let shouldScroll = false

	$effect.pre(() => {
		// This is needed to make sure that the effect is triggered on messages change
		store.messages.length

		if (!consoleContainer) {
			return
		}

		shouldScroll =
			consoleContainer.scrollHeight - consoleContainer.clientHeight - consoleContainer.scrollTop <
			SCROLL_THRESHOLD
	})

	$effect(() => {
		// This is needed to make sure that the effect is triggered on messages change
		store.messages.length

		if (shouldScroll && consoleContainer) {
			consoleContainer.scrollTop = consoleContainer.scrollHeight
		}
	})

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
		if (!store.commandInput.trim()) {
			return
		}
		server.sendCommand(store.commandInput)
		store.commandInput = ''
	}
</script>

<div>
	<div
		bind:this={consoleContainer}
		class="flex h-96 flex-col gap-2 overflow-y-scroll font-mono text-xs"
	>
		{#each store.messages as message}
			<div>
				<span class="overflow-x-scroll text-nowrap">{message}</span>
			</div>
		{/each}
	</div>
	<div>
		<form onsubmit={handleSubmit} class="flex gap-2">
			<!-- svelte-ignore a11y_autofocus -->
			<input bind:value={store.commandInput} type="text" class="flex-1" autofocus />
			<button type="submit">Send</button>
		</form>
	</div>
</div>
