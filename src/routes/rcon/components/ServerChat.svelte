<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import { Input } from '$lib/components/ui/input/index.js'
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import { tick } from 'svelte'
	import type { RustServer } from '../core/rust-server.svelte'
	import { WebSocketConnectionStatus } from '../core/websocket-wrapper'
	import { getServerChatStore, type ServerChatStore } from '../stores/server-chat.svelte'
	import ServerChatEntry from './ServerChatEntry.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()
	let config = getConfigGlobalContext()
	let store: ServerChatStore = $derived(getServerChatStore(server.id, config))

	let chatContainer: HTMLDivElement | undefined
	let pendingScrollSync = false
	let didRestoreScrollPosition = false
	const SCROLL_THRESHOLD = 16 * 2

	function isNearBottom() {
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
		store.lastShouldScroll = isNearBottom()
	}

	function queueScrollSync() {
		if (!chatContainer || pendingScrollSync) {
			return
		}

		const shouldScroll = store.lastShouldScroll ?? true
		const previousScrollTop = chatContainer.scrollTop
		pendingScrollSync = true

		tick().then(() => {
			pendingScrollSync = false

			if (!chatContainer) {
				return
			}

			if (shouldScroll) {
				scrollToBottom()
				store.lastShouldScroll = true
				store.lastScrollTop = chatContainer.scrollTop
			} else {
				chatContainer.scrollTop = previousScrollTop
				store.lastScrollTop = chatContainer.scrollTop
			}
		})
	}

	$effect(() => {
		if (!chatContainer) {
			didRestoreScrollPosition = false
			return
		}

		if (chatContainer && store.lastContainerHeight) {
			chatContainer.style.height = store.lastContainerHeight
		}
		if (chatContainer && store.lastShouldScroll == null) {
			store.lastShouldScroll =
				chatContainer.scrollHeight - chatContainer.clientHeight - chatContainer.scrollTop < SCROLL_THRESHOLD
			store.lastScrollTop = chatContainer.scrollTop
		}

		if (!didRestoreScrollPosition) {
			didRestoreScrollPosition = true
			tick().then(() => {
				if (!chatContainer) {
					return
				}

				if (store.lastShouldScroll ?? true) {
					scrollToBottom()
				} else if (store.lastScrollTop != null) {
					chatContainer.scrollTop = store.lastScrollTop
				}
			})
		}

		return () => {
			if (chatContainer?.style.height) {
				store.lastContainerHeight = chatContainer.style.height
			}
		}
	})

	$effect.pre(() => {
		// This is needed to make sure that the effect is triggered on any rendered chat change
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		store.renderVersion

		if (!chatContainer) {
			return
		}

		queueScrollSync()
	})

	$effect(() => {
		store.tryPopulateChat(server)
		store.trySubscribeToMessagesPlayerRelated(server)
	})

	function handleSubmit(e: SubmitEvent) {
		// prevent unfocus
		e.preventDefault()

		if (!store.chatCommandInput.trim() || !server.canSendCommands()) {
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
		class="bg-card flex h-95 resize-y flex-col overflow-x-scroll overflow-y-scroll overscroll-contain rounded-md border"
	>
		<div class="mt-auto flex flex-col gap-0.5 p-2 font-mono text-xs text-nowrap">
			{#each store.chatMessages as entry (entry.id)}
				<ServerChatEntry entry={entry.message} />
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
				placeholder={server.canSendCommands()
					? 'Enter chat message...'
					: server.connectionStatus === WebSocketConnectionStatus.Connected
						? 'Server is still starting...'
						: 'Chat is unavailable while disconnected'}
				disabled={!server.canSendCommands()}
			/>
			<Button type="submit" disabled={!server.canSendCommands()}>Send</Button>
		</form>
	</div>
</div>
