<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import { Input } from '$lib/components/ui/input/index.js'
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import { tick } from 'svelte'
	import type { RustServer } from '../core/rust-server.svelte'
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
	const SCROLL_THRESHOLD = 16 * 2

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

	function handleSubmit(e: SubmitEvent) {
		// prevent unfocus
		e.preventDefault()

		if (!store.commandInput.trim()) {
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
			{#if !store.isPopulatedConsole}
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
				placeholder="Enter command..."
			/>
			<Button type="submit">Send</Button>
		</form>
	</div>
</div>
