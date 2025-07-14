<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import { Input } from '$lib/components/ui/input/index.js'
	import { tick } from 'svelte'
	import type { RustServer } from './rust-server.svelte'
	import {
		getServerConsoleStore,
		ServerConsoleMessageType,
		type ServerConsoleStore,
	} from './server-console.svelte'
	import ServerConsoleEntry from './ServerConsoleEntry.svelte'
	import { getConfigGlobalContext } from '$lib/config-global.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()
	let config = getConfigGlobalContext()
	let store: ServerConsoleStore = $derived(getServerConsoleStore(server.id, config))

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

	$effect(() => {
		if (consoleContainer && store.lastContainerHeight) {
			consoleContainer.style.height = store.lastContainerHeight
		}
		return () => {
			if (consoleContainer?.style.height) {
				store.lastContainerHeight = consoleContainer.style.height
			}
		}
	})

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
			const msg = store.parseMessage(response)
			if (userCommand.responses == null) {
				userCommand.responses = []
			}
			userCommand.responses.push(msg)
			scrollToBottomIfNeeded()
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
		class="bg-card flex h-[600px] resize-y flex-col overflow-x-scroll overflow-y-scroll overscroll-contain rounded-md border"
	>
		<div class="mt-auto flex flex-col gap-0.5 p-2 font-mono text-xs text-nowrap">
			{#each store.messages as message (message.id)}
				<ServerConsoleEntry {message} />
			{/each}
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
