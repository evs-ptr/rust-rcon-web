<script lang="ts">
	import type { RustServer } from './rust-server.svelte'
	import {
		getServerConsoleStore,
		ServerConsoleMessageType,
		type ServerConsoleStore,
	} from './server-console.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()
	let store: ServerConsoleStore = $derived(getServerConsoleStore(server.id))

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

	$effect(() => {
		store.tryPopulateConsole(server)
		store.trySubscribeToMessages(server)
	})

	function handleSubmit() {
		if (!store.commandInput.trim()) {
			return
		}
		server.sendCommand(store.commandInput)
		store.addMessageRaw(store.commandInput, ServerConsoleMessageType.UserCommand)
		store.commandInput = ''
	}
</script>

<div>
	<div
		bind:this={consoleContainer}
		class="flex h-96 flex-col gap-2 overflow-x-scroll overflow-y-scroll font-mono text-xs text-nowrap"
	>
		{#each store.messages as message, i (i)}
			<div>
				<span>{message.text}</span>
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
