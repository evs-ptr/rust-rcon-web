import type { ConfigGlobal } from '$lib/config-global.svelte'
import { CommandHistory } from './command-history.svelte'
import { parseChatEntries, parseChatEntry, type ChatEntry } from '../core/rust-rcon-chat'
import { LogType, type CommandResponse } from '../core/rust-rcon.types'
import type { RustServer } from '../core/rust-server.svelte'

const INITIAL_CHAT_SYNC_TIMEOUT = 20_000
const INITIAL_CHAT_SYNC_RETRY_DELAY = 3_000

function scheduleNextFrame(callback: () => void): number {
	if (typeof requestAnimationFrame === 'function') {
		return requestAnimationFrame(callback)
	}
	return setTimeout(callback, 16) as unknown as number
}

function cancelScheduledFrame(handle: number) {
	if (typeof cancelAnimationFrame === 'function') {
		cancelAnimationFrame(handle)
		return
	}
	clearTimeout(handle)
}

export class ServerChatMessage {
	private static idCounter = 0
	public readonly id: number

	public readonly message: ChatEntry

	constructor(message: ChatEntry) {
		this.id = ServerChatMessage.idCounter++
		this.message = message
	}
}

export class ServerChatStore {
	public readonly config: ConfigGlobal

	readonly chatMessages: ServerChatMessage[] = $state([])
	public renderVersion: number = $state(0)

	chatCommandInput: string = $state('')
	public readonly history: CommandHistory = new CommandHistory()

	public lastScrollTop: number | null = null
	public lastShouldScroll: boolean | null = null
	public lastContainerHeight: string | null = null

	public isPopulatedChat: boolean = $state(false)
	public isPopulatingChat: boolean = $state(false)
	public populateChatError: string | null = $state(null)

	private didPopulateInitialChat = false
	private populateRetryTimeout: ReturnType<typeof setTimeout> | null = null
	private unsubscribeOnMessagesPlayerRelated: (() => void) | null = null
	private pendingMessages: ServerChatMessage[] = []
	private pendingFrameHandle: number | null = null

	constructor(config: ConfigGlobal) {
		this.config = config
	}

	private clampMessagesIfNeeded(willBeAddedCount: number) {
		if (!this.config.chatHistoryLimitEnable) {
			return
		}

		const length = this.chatMessages.length

		const percentile = this.config.chatHistoryLimit * 0.1 // 10%

		if (length + willBeAddedCount < this.config.chatHistoryLimit + percentile) {
			return
		}

		const toRemove = length - this.config.chatHistoryLimit + willBeAddedCount

		this.chatMessages.splice(0, toRemove)
	}

	private pushMessage(msg: ServerChatMessage) {
		this.clampMessagesIfNeeded(1)
		this.chatMessages.push(msg)
		this.renderVersion += 1
	}

	private pushMessages(msgs: ServerChatMessage[]) {
		this.clampMessagesIfNeeded(msgs.length)
		this.chatMessages.push(...msgs)
		if (msgs.length > 0) {
			this.renderVersion += 1
		}
	}

	private prependMessages(msgs: ServerChatMessage[]) {
		if (msgs.length === 0) {
			return
		}

		this.chatMessages.unshift(...msgs)

		if (this.config.chatHistoryLimitEnable && this.chatMessages.length > this.config.chatHistoryLimit) {
			const toRemove = this.chatMessages.length - this.config.chatHistoryLimit
			this.chatMessages.splice(0, toRemove)
		}

		this.renderVersion += 1
	}

	private schedulePendingFlush() {
		if (this.pendingFrameHandle != null) {
			return
		}

		this.pendingFrameHandle = scheduleNextFrame(() => {
			this.pendingFrameHandle = null
			this.flushPendingMessages()
		})
	}

	private flushPendingMessages() {
		if (this.pendingMessages.length === 0) {
			return
		}

		this.pushMessages(this.pendingMessages)
		this.pendingMessages = []
	}

	private enqueueMessage(msg: ServerChatMessage) {
		this.pendingMessages.push(msg)
		this.schedulePendingFlush()
	}

	private schedulePopulateRetry(server: RustServer) {
		if (this.populateRetryTimeout || this.didPopulateInitialChat) {
			return
		}

		this.populateRetryTimeout = setTimeout(() => {
			this.populateRetryTimeout = null
			void this.tryPopulateChat(server)
		}, INITIAL_CHAT_SYNC_RETRY_DELAY)
	}

	parseChatMessage(message: ChatEntry): ServerChatMessage {
		return new ServerChatMessage(message)
	}

	addChatMessage(message: ChatEntry): ServerChatMessage {
		const msg = this.parseChatMessage(message)
		this.enqueueMessage(msg)
		return msg
	}

	addChatMessageFromCommandResponse(message: CommandResponse) {
		const chatEntry = parseChatEntry(message)
		if (chatEntry) {
			this.addChatMessage(chatEntry)
		}
	}

	async tryPopulateChat(server: RustServer) {
		if (this.didPopulateInitialChat || this.isPopulatingChat || !server.canProbeCommandReadiness()) {
			return
		}

		try {
			this.isPopulatingChat = true
			this.populateChatError = null

			const chatMessages: ServerChatMessage[] = []

			const responseChat = await server.sendCommandGetResponse(
				`chat.tail ${this.config.chatHistoryFetch}`,
				INITIAL_CHAT_SYNC_TIMEOUT
			)
			if (!responseChat) {
				return
			}

			const messagesChat = parseChatEntries(responseChat)
			if (messagesChat) {
				chatMessages.push(...messagesChat.map(this.parseChatMessage.bind(this)))
			}

			if (this.chatMessages.length > 0) {
				this.prependMessages(chatMessages)
			} else {
				this.pushMessages(chatMessages)
			}

			this.didPopulateInitialChat = true
			this.isPopulatedChat = true
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load recent chat history'

			if (errorMessage === 'Timed out waiting for response' && server.canProbeCommandReadiness()) {
				this.schedulePopulateRetry(server)
				return
			}

			this.populateChatError = errorMessage
			console.error('Failed to populate chat:', error)
		} finally {
			this.isPopulatingChat = false
		}
	}

	onMessagePlayerRelated(msg: CommandResponse) {
		if (msg.Type == LogType.Chat) {
			this.populateChatError = null
			this.addChatMessageFromCommandResponse(msg)
		}
	}

	trySubscribeToMessagesPlayerRelated(server: RustServer) {
		if (this.unsubscribeOnMessagesPlayerRelated) {
			return
		}
		this.unsubscribeOnMessagesPlayerRelated = server.subscribeOnMessagePlayerRelated(
			`chat_${server.id}`,
			this.onMessagePlayerRelated.bind(this)
		)
	}

	destroy() {
		this.unsubscribeOnMessagesPlayerRelated?.()
		this.unsubscribeOnMessagesPlayerRelated = null
		if (this.populateRetryTimeout != null) {
			clearTimeout(this.populateRetryTimeout)
			this.populateRetryTimeout = null
		}
		if (this.pendingFrameHandle != null) {
			cancelScheduledFrame(this.pendingFrameHandle)
			this.pendingFrameHandle = null
		}
		this.pendingMessages = []
		this.chatMessages.length = 0
		this.didPopulateInitialChat = false
		this.isPopulatingChat = false
		this.populateChatError = null
	}
}

const map = new Map<number, ServerChatStore>()

function createServerChatStore(id: number, config: ConfigGlobal): ServerChatStore {
	const store = new ServerChatStore(config)
	map.set(id, store)
	return store
}

export function removeServerChatStore(id: number): boolean {
	const store = map.get(id)
	if (store) {
		store.destroy()
	}
	return map.delete(id)
}

export function getServerChatStore(id: number, config: ConfigGlobal): ServerChatStore {
	const store = map.get(id)
	if (store) {
		return store
	}
	return createServerChatStore(id, config)
}
