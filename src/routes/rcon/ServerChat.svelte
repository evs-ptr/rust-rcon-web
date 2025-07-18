<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import { Input } from '$lib/components/ui/input/index.js'
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import { tick } from 'svelte'
	import type { RustServer } from './rust-server.svelte'
	import { getServerChatStore, type ServerChatStore } from './server-chat.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()
	let config = getConfigGlobalContext()
	let store: ServerChatStore = $derived(getServerChatStore(server.id, config))

	let chatContainer: HTMLDivElement | undefined

	function calculateShouldScroll() {
		const SCROLL_THRESHOLD = 16 * 2
		if (!chatContainer) {
			return false
		}

		return (
			chatContainer.scrollHeight - chatContainer.clientHeight - chatContainer.scrollTop < SCROLL_THRESHOLD
		)
	}

	function scrollToBottom() {
		if (!chatContainer) {
			return
		}
		chatContainer.scrollTop = chatContainer.scrollHeight
	}

	function handleScroll() {
		if (!chatContainer) {
			return
		}
		store.lastScrollTop = chatContainer.scrollTop
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

	$effect(() => {
		if (chatContainer && store.lastContainerHeight) {
			chatContainer.style.height = store.lastContainerHeight
		}
		return () => {
			if (chatContainer?.style.height) {
				store.lastContainerHeight = chatContainer.style.height
			}
		}
	})

	$effect.pre(() => {
		// This is needed to make sure that the effect is triggered on messages change
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		store.chatMessages.length

		if (!chatContainer) {
			return
		}

		scrollToBottomIfNeeded()
	})

	$effect(() => {
		if (!chatContainer) {
			return
		}

		if (store.lastShouldScroll) {
			scrollToBottom()
		} else if (store.lastScrollTop != null) {
			chatContainer.scrollTop = store.lastScrollTop
		}
	})

	$effect(() => {
		store.tryPopulateChat(server)
		store.trySubscribeToMessagesPlayerRelated(server)
	})

	function handleSubmit(e: SubmitEvent) {
		// prevent unfocus
		e.preventDefault()

		if (!store.chatCommandInput.trim()) {
			return
		}

		const chatMessage = store.chatCommandInput

		store.history.add(chatMessage)

		server.sendCommand(`global.say ${chatMessage}`)

		store.chatCommandInput = ''
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key == 'ArrowUp' || event.key == 'ArrowDown') {
			event.preventDefault()

			const history = store.history.commands
			if (history.length === 0) {
				return
			}

			if (event.key == 'ArrowUp') {
				if (store.history.pos === -1) {
					store.history.wip = store.chatCommandInput
				}

				store.history.pos = Math.min(history.length - 1, store.history.pos + 1)
			} else {
				store.history.pos = Math.max(-1, store.history.pos - 1)
			}

			if (store.history.pos >= 0) {
				store.chatCommandInput = store.history.commands[store.history.pos]
			} else {
				store.chatCommandInput = store.history.wip
			}
		}
	}
</script>

<div class="flex flex-col gap-2">
	<div
		bind:this={chatContainer}
		onscroll={handleScroll}
		class="bg-card flex h-[600px] resize-y flex-col overflow-x-scroll overflow-y-scroll overscroll-contain rounded-md border"
	>
		<div class="mt-auto flex flex-col gap-0.5 p-2 font-mono text-xs text-nowrap">
			{#each store.chatMessages as entry (entry.id)}
				<span>{entry.message.Message}</span>
			{/each}
		</div>
	</div>
	<div>
		<form onsubmit={handleSubmit} class="flex gap-2">
			<Input
				bind:value={store.chatCommandInput}
				onkeydown={handleKeydown}
				type="text"
				class="flex-1"
				placeholder="Enter chat message..."
			/>
			<Button type="submit">Send</Button>
		</form>
	</div>
</div>
