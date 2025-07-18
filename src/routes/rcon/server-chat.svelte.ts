import type { ConfigGlobal } from '$lib/config-global.svelte'
import { CommandHistory } from './command-history.svelte'
import { parseChatEntries, parseChatEntry, type ChatEntry } from './rust-rcon-chat'
import { LogType, type CommandResponse } from './rust-rcon.types'
import type { RustServer } from './rust-server.svelte'

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

	chatCommandInput: string = $state('')
	public readonly history: CommandHistory = new CommandHistory()

	public lastScrollTop: number | null = null
	public lastShouldScroll: boolean | null = null
	public lastContainerHeight: string | null = null

	public isPopulatedChat: boolean = $state(false)

	private unsubscribeOnMessagesPlayerRelated: (() => void) | null = null

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
	}

	private pushMessages(msgs: ServerChatMessage[]) {
		this.clampMessagesIfNeeded(msgs.length)
		this.chatMessages.push(...msgs)
	}

	parseChatMessage(message: ChatEntry): ServerChatMessage {
		return new ServerChatMessage(message)
	}

	addChatMessage(message: ChatEntry): ServerChatMessage {
		const msg = this.parseChatMessage(message)
		this.pushMessage(msg)
		return msg
	}

	addChatMessageFromCommandResponse(message: CommandResponse) {
		const chatEntry = parseChatEntry(message)
		if (chatEntry) {
			this.addChatMessage(chatEntry)
		}
	}

	async tryPopulateChat(server: RustServer) {
		if (this.isPopulatedChat) {
			return
		}

		const chatMessages: ServerChatMessage[] = []

		const responseChat = await server.sendCommandGetResponse(`chat.tail ${this.config.chatHistoryFetch}`)
		if (!responseChat) {
			console.error('Failed to get chat.tail')
			return
		}

		const messagesChat = parseChatEntries(responseChat)
		if (messagesChat) {
			chatMessages.push(...messagesChat.map(this.parseChatMessage.bind(this)))
		}

		this.pushMessages(chatMessages)

		this.isPopulatedChat = true
	}

	onMessagePlayerRelated(msg: CommandResponse) {
		if (msg.Type == LogType.Chat) {
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
		this.chatMessages.length = 0
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
