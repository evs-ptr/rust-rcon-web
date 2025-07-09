<script lang="ts">
	import { tick } from 'svelte'
	import type { RustServer } from './rust-server.svelte'
	import {
		getServerConsoleStore,
		ServerConsoleMessage,
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

	function scrollToBottomIfNeeded() {
		const shouldScroll = calculateShouldScroll() && (store.lastShouldScroll || store.lastShouldScroll == null)
		if (shouldScroll) {
			tick().then(() => {
				scrollToBottom()
			})
		}
	}

	$effect.pre(() => {
		// This is needed to make sure that the effect is triggered on messages change
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		store.messages.length

		if (!consoleContainer) {
			return
		}

		scrollToBottomIfNeeded()
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
		store.trySubscribeToMessagesGeneral(server)
	})

	function handleSubmit() {
		if (!store.commandInput.trim()) {
			return
		}

		const command = store.commandInput

		const userCommand = store.addMessageRaw(command, ServerConsoleMessageType.UserCommand)

		server
			.sendCommandGetResponse(command)
			.then((response) => {
				if (response) {
					const msg = store.parseMessage(response)
					userCommand.response = msg
					console.log(msg)
					scrollToBottomIfNeeded()
				}
			})
			.catch(() => {
				// ignore
			})

		store.commandInput = ''
	}
</script>

<div class="flex flex-col gap-2">
	<div
		bind:this={consoleContainer}
		onscroll={handleScroll}
		class="flex h-[70vh] resize-y flex-col overflow-x-scroll overflow-y-scroll font-mono text-xs text-nowrap"
	>
		<div class="mt-auto flex flex-col gap-0.5 py-4">
			{#each store.messages as message (message.id)}
				{@render consoleMessage(message)}
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

{#snippet consoleMessage(message: ServerConsoleMessage)}
	{@const formattedDate =
		`${message.timestamp.getHours().toString().padStart(2, '0')}` +
		`:${message.timestamp.getMinutes().toString().padStart(2, '0')}` +
		`:${message.timestamp.getSeconds().toString().padStart(2, '0')}`}
	{@const splitted = message.text.split('\n')}
	<div>
		<div class="flex gap-4">
			<span class="text-blue-600">{formattedDate}</span>
			<div class="flex flex-col">
				{#each splitted as line, i (i)}
					<span>{line}</span>
				{/each}
			</div>
		</div>
		{#if message.response}
			{@const splitted = message.response.text.split('\n')}
			<div class="flex flex-col text-gray-600">
				{#each splitted as line, i (i)}
					<span>{line}</span>
				{/each}
			</div>
		{/if}
	</div>
{/snippet}
