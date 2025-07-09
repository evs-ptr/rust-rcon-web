<script lang="ts">
	import { tick } from 'svelte'
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

	function calculateShouldScroll() {
		const SCROLL_THRESHOLD = 16 * 2
		if (!consoleContainer) {
			return false
		}

		return (
			consoleContainer.scrollHeight - consoleContainer.clientHeight - consoleContainer.scrollTop <
			SCROLL_THRESHOLD
		)
	}

	function scrollToBottom() {
		if (!consoleContainer) {
			return
		}
		consoleContainer.scrollTop = consoleContainer.scrollHeight
	}

	function handleScroll() {
		if (!consoleContainer) {
			return
		}
		store.lastScrollTop = consoleContainer.scrollTop
		store.lastShouldScroll = calculateShouldScroll()
	}

	$effect.pre(() => {
		// This is needed to make sure that the effect is triggered on messages change
		store.messages.length

		if (!consoleContainer) {
			return
		}

		const shouldScroll = calculateShouldScroll() && (store.lastShouldScroll || store.lastShouldScroll == null)
		if (shouldScroll) {
			tick().then(() => {
				scrollToBottom()
			})
		}
	})

	$effect(() => {
		if (!consoleContainer) {
			return
		}

		if (store.lastShouldScroll) {
			scrollToBottom()
		} else if (store.lastScrollTop != null) {
			consoleContainer.scrollTop = store.lastScrollTop
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

<div class="flex flex-col gap-2">
	<div
		bind:this={consoleContainer}
		onscroll={handleScroll}
		class="flex h-[70vh] resize-y flex-col overflow-x-scroll overflow-y-scroll font-mono text-xs text-nowrap"
	>
		<div class="mt-auto py-4">
			{#each store.messages as message (message.id)}
				<div>
					<span>{message.text}</span>
				</div>
			{/each}
		</div>
	</div>
	<div>
		<form onsubmit={handleSubmit} class="flex gap-2">
			<!-- svelte-ignore a11y_autofocus -->
			<input bind:value={store.commandInput} type="text" class="flex-1" autofocus />
			<button type="submit">Send</button>
		</form>
	</div>
</div>
