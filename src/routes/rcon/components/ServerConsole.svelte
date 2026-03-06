<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import { Input } from '$lib/components/ui/input/index.js'
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import { tick } from 'svelte'
	import type { RustServer } from '../core/rust-server.svelte'
	import { WebSocketConnectionStatus } from '../core/websocket-wrapper'
	import {
		getServerConsoleStore,
		ServerConsoleMessageType,
		type ServerConsoleStore,
	} from '../stores/server-console.svelte'
	import ServerConsoleEntry from './ServerConsoleEntry.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()
	let config = getConfigGlobalContext()
	let store: ServerConsoleStore = $derived(getServerConsoleStore(server.id, config))

	let consoleContainer: HTMLDivElement | undefined
	let pendingScrollSync = false
	let didRestoreScrollPosition = false
	let isManualReconnectPending = false
	let lastLifecycleNoticeAt: number | null = null
	const SCROLL_THRESHOLD = 16 * 2

	function formatDelay(delayMs: number | null) {
		if (delayMs == null) {
			return null
		}

		if (delayMs < 1_000) {
			return `${delayMs} ms`
		}

		return `${(delayMs / 1_000).toFixed(1)}s`
	}

	function getEmptyStateText() {
		if (server.connectionStatus === WebSocketConnectionStatus.Connected) {
			if (store.populateConsoleError) {
				return 'Connected, but recent console history could not be loaded yet.'
			}

			return 'Connected. Waiting for the first console or chat messages from the server.'
		}

		switch (server.connectionStatus) {
			case WebSocketConnectionStatus.Connecting:
				return 'Connecting to RCON...'
			case WebSocketConnectionStatus.Reconnecting:
				return `Reconnecting to RCON${server.reconnectDelayMs ? ` in ${formatDelay(server.reconnectDelayMs)}` : ''}${server.reconnectAttempt ? ` (attempt ${server.reconnectAttempt})` : ''}.`
			case WebSocketConnectionStatus.ReconnectFailed:
				return 'Disconnected from RCON. Automatic reconnect stopped.'
			case WebSocketConnectionStatus.Disconnected:
				return 'Disconnected from RCON.'
			default:
				return 'Not connected.'
		}
	}

	function isNearBottom() {
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
		store.lastShouldScroll = isNearBottom()
	}

	function queueScrollSync() {
		if (!consoleContainer || pendingScrollSync) {
			return
		}

		const shouldScroll = store.lastShouldScroll ?? true
		const previousScrollTop = consoleContainer.scrollTop
		pendingScrollSync = true

		tick().then(() => {
			pendingScrollSync = false

			if (!consoleContainer) {
				return
			}

			if (shouldScroll) {
				scrollToBottom()
				store.lastShouldScroll = true
				store.lastScrollTop = consoleContainer.scrollTop
			} else {
				consoleContainer.scrollTop = previousScrollTop
				store.lastScrollTop = consoleContainer.scrollTop
			}
		})
	}

	$effect(() => {
		if (!consoleContainer) {
			didRestoreScrollPosition = false
			return
		}

		if (consoleContainer && store.lastContainerHeight) {
			consoleContainer.style.height = store.lastContainerHeight
		}
		if (consoleContainer && store.lastShouldScroll == null) {
			store.lastShouldScroll =
				consoleContainer.scrollHeight - consoleContainer.clientHeight - consoleContainer.scrollTop <
				SCROLL_THRESHOLD
			store.lastScrollTop = consoleContainer.scrollTop
		}

		if (!didRestoreScrollPosition) {
			didRestoreScrollPosition = true
			tick().then(() => {
				if (!consoleContainer) {
					return
				}

				if (store.lastShouldScroll ?? true) {
					scrollToBottom()
				} else if (store.lastScrollTop != null) {
					consoleContainer.scrollTop = store.lastScrollTop
				}
			})
		}

		return () => {
			if (consoleContainer?.style.height) {
				store.lastContainerHeight = consoleContainer.style.height
			}
		}
	})

	$effect.pre(() => {
		// This is needed to make sure that the effect is triggered on any rendered console change
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		store.renderVersion

		if (!consoleContainer) {
			return
		}

		queueScrollSync()
	})

	$effect(() => {
		store.tryPopulateConsole(server)
		store.trySubscribeToMessagesGeneral(server)
		store.trySubscribeToMessagesPlayerRelated(server)
	})

	$effect(() => {
		const event = server.lastLifecycleEvent
		if (!event) {
			return
		}

		const eventTimestamp = event.at.getTime()
		if (lastLifecycleNoticeAt === eventTimestamp) {
			return
		}
		lastLifecycleNoticeAt = eventTimestamp

		switch (event.status) {
			case WebSocketConnectionStatus.Connected:
				store.addMessageRaw(
					event.wasReconnect ? 'Reconnected to RCON.' : 'Connected to RCON.',
					ServerConsoleMessageType.System
				)
				break
			case WebSocketConnectionStatus.Reconnecting:
				store.addMessageRaw(
					`Lost RCON connection. Reconnecting${event.delayMs ? ` in ${formatDelay(event.delayMs)}` : ''}${event.attempt ? ` (attempt ${event.attempt})` : ''}.`,
					ServerConsoleMessageType.System
				)
				break
			case WebSocketConnectionStatus.ReconnectFailed:
				store.addMessageRaw(
					'Disconnected from RCON. Automatic reconnect stopped.',
					ServerConsoleMessageType.System
				)
				break
			case WebSocketConnectionStatus.Disconnected:
				if (server.connectionWasEstablished && !event.wasReconnect) {
					store.addMessageRaw('Disconnected from RCON.', ServerConsoleMessageType.System)
				}
				break
			default:
				break
		}
	})

	async function reconnect() {
		if (isManualReconnectPending) {
			return
		}

		isManualReconnectPending = true
		try {
			await server.connect()
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown connection error'
			store.addMessageRaw(`Manual reconnect failed: ${message}`, ServerConsoleMessageType.System)
		} finally {
			isManualReconnectPending = false
		}
	}

	function handleSubmit(e: SubmitEvent) {
		// prevent unfocus
		e.preventDefault()

		if (!store.commandInput.trim() || !server.canSendCommands()) {
			return
		}

		const command = store.commandInput

		const userCommand = store.addMessageRaw(command, ServerConsoleMessageType.UserCommand)

		store.history.add(command)

		server.sendCommandGetResponsesMany(command, (response) => {
			store.addCommandResponse(userCommand, response)
		})

		store.commandInput = ''
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
					store.history.wip = store.commandInput
				}

				store.history.pos = Math.min(history.length - 1, store.history.pos + 1)
			} else {
				store.history.pos = Math.max(-1, store.history.pos - 1)
			}

			if (store.history.pos >= 0) {
				store.commandInput = store.history.commands[store.history.pos]
			} else {
				store.commandInput = store.history.wip
			}
		}
	}
</script>

<div class="flex flex-col gap-2">
	<div
		bind:this={consoleContainer}
		onscroll={handleScroll}
		class="bg-card flex h-150 resize-y flex-col overflow-x-scroll overflow-y-scroll overscroll-contain rounded-md border"
	>
		<div class="mt-auto flex flex-col gap-0.5 p-2 font-mono text-xs text-nowrap">
			{#if !store.isPopulatedConsole && store.isPopulatingConsole && server.connectionStatus === WebSocketConnectionStatus.Connected}
				{@const skeletonClass = 'bg-muted h-4 animate-pulse rounded-lg mt-2.5'}
				<div class={[skeletonClass, 'w-1/3']}></div>
				<div class={[skeletonClass, 'w-1/2']}></div>
				<div class={[skeletonClass, 'w-1/4']}></div>
				<div class={[skeletonClass, 'w-2/3']}></div>
				<div class={[skeletonClass, 'w-3/4']}></div>
				<div class={[skeletonClass, 'w-1/2']}></div>
				<div class={[skeletonClass, 'w-1/5']}></div>
				<div class={[skeletonClass, 'w-5/6']}></div>
				<div class={[skeletonClass, 'w-2/5']}></div>
			{:else if !store.isPopulatedConsole || store.messages.length === 0}
				<div
					class="text-muted-foreground flex min-h-48 items-center justify-center px-4 py-8 text-center text-sm whitespace-normal"
				>
					{getEmptyStateText()}
				</div>
			{:else}
				{#each store.messages as message (message.id)}
					<ServerConsoleEntry {message} showTimestamp={config.consoleShowTimestamp} />
				{/each}
			{/if}
		</div>
	</div>
	<div>
		<form onsubmit={handleSubmit} class="flex gap-2">
			<Input
				bind:value={store.commandInput}
				onkeydown={handleKeydown}
				type="text"
				class="flex-1"
				placeholder={server.canSendCommands()
					? 'Enter command...'
					: 'Commands are unavailable while disconnected'}
				disabled={!server.canSendCommands()}
			/>
			<Button
				type={server.canSendCommands() ? 'submit' : 'button'}
				onclick={!server.canSendCommands() ? reconnect : undefined}
				disabled={isManualReconnectPending}
			>
				{server.canSendCommands() ? 'Send' : 'Reconnect'}
			</Button>
		</form>
	</div>
</div>
