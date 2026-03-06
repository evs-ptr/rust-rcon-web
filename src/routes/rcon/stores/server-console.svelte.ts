import type { ConfigGlobal } from '$lib/config-global.svelte'
import { CommandHistory } from './command-history.svelte'
import { parseChatEntries, parseChatEntry, type ChatEntry } from '../core/rust-rcon-chat'
import { LogType, type CommandResponse, type HistoryMessage } from '../core/rust-rcon.types'
import type { RustServer } from '../core/rust-server.svelte'

const map = new Map<number, ServerConsoleStore>()

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

export enum ServerConsoleMessageType {
	Console = 0,
	UserCommand = 1,
	System = 2,
}

export class ServerConsoleMessage {
	private static idCounter = 0
	public readonly id: number

	public readonly message: string | ChatEntry
	public readonly type: ServerConsoleMessageType
	public readonly logType: LogType

	public readonly timestamp: Date

	public responses: ServerConsoleMessage[] | null = $state(null)

	constructor(
		message: string | ChatEntry,
		type: ServerConsoleMessageType,
		consoleType: LogType,
		timestamp: Date
	) {
		this.id = ServerConsoleMessage.idCounter++
		this.message = message
		this.type = type
		this.logType = consoleType
		this.timestamp = timestamp
	}
}

export class ServerConsoleStore {
	public readonly config: ConfigGlobal

	// TODO: make it NOT deep
	public readonly messages: ServerConsoleMessage[] = $state([])
	public commandInput: string = $state('')
	public renderVersion: number = $state(0)

	public readonly history: CommandHistory = new CommandHistory()

	public lastScrollTop: number | null = null
	public lastShouldScroll: boolean | null = null
	public lastContainerHeight: string | null = null

	public isPopulatedConsole: boolean = $state(false)
	private unsubscribeOnMessagesGeneral: (() => void) | null = null
	private unsubscribeOnMessagesPlayerRelated: (() => void) | null = null
	private pendingMessages: ServerConsoleMessage[] = []
	private pendingCommandResponses = new Map<ServerConsoleMessage, ServerConsoleMessage[]>()
	private pendingFrameHandle: number | null = null

	constructor(config: ConfigGlobal) {
		this.config = config
	}

	private clampMessagesIfNeeded(willBeAddedCount: number) {
		if (!this.config.consoleHistoryLimitEnable) {
			return
		}

		const length = this.messages.length

		const percentile = this.config.consoleHistoryLimit * 0.1 // 10%

		if (length + willBeAddedCount < this.config.consoleHistoryLimit + percentile) {
			return
		}

		const toRemove = length - this.config.consoleHistoryLimit + willBeAddedCount

		this.messages.splice(0, toRemove)
	}

	private pushMessage(msg: ServerConsoleMessage) {
		this.clampMessagesIfNeeded(1)
		this.messages.push(msg)
		this.renderVersion += 1
	}

	private pushMessages(msgs: ServerConsoleMessage[]) {
		this.clampMessagesIfNeeded(msgs.length)
		this.messages.push(...msgs)
		if (msgs.length > 0) {
			this.renderVersion += 1
		}
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
		if (this.pendingMessages.length > 0) {
			this.pushMessages(this.pendingMessages)
			this.pendingMessages = []
		}

		if (this.pendingCommandResponses.size > 0) {
			for (const [commandMessage, responses] of this.pendingCommandResponses) {
				if (commandMessage.responses == null) {
					commandMessage.responses = []
				}
				commandMessage.responses.push(...responses)
			}

			this.pendingCommandResponses.clear()
			this.renderVersion += 1
		}
	}

	private enqueueMessage(msg: ServerConsoleMessage) {
		this.pendingMessages.push(msg)
		this.schedulePendingFlush()
	}

	addMessageRaw(message: string, type: ServerConsoleMessageType, consoleType: LogType = LogType.Generic) {
		const timestamp = new Date()
		const msg = new ServerConsoleMessage(message, type, consoleType, timestamp)
		this.pushMessage(msg)
		return msg
	}

	parseMessage(message: CommandResponse) {
		const timestamp = new Date()
		return new ServerConsoleMessage(
			message.Message,
			ServerConsoleMessageType.Console,
			message.Type,
			timestamp
		)
	}

	parseHistoryMessage(message: HistoryMessage) {
		const timestamp = new Date(message.Time * 1000)
		return new ServerConsoleMessage(
			message.Message,
			ServerConsoleMessageType.Console,
			message.Type,
			timestamp
		)
	}

	parseChatMessage(message: ChatEntry) {
		const timestamp = new Date(message.Time * 1000)
		return new ServerConsoleMessage(message, ServerConsoleMessageType.Console, LogType.Chat, timestamp)
	}

	addMessage(message: CommandResponse): ServerConsoleMessage {
		const msg = this.parseMessage(message)
		this.enqueueMessage(msg)
		return msg
	}

	addHistoryMessage(message: HistoryMessage) {
		const msg = this.parseHistoryMessage(message)
		this.pushMessage(msg)
		return msg
	}

	addChatMessage(message: ChatEntry): ServerConsoleMessage {
		const msg = this.parseChatMessage(message)
		this.enqueueMessage(msg)
		return msg
	}

	addChatMessageFromCommandResponse(message: CommandResponse): ServerConsoleMessage {
		const chatEntry = parseChatEntry(message)
		if (chatEntry) {
			return this.addChatMessage(chatEntry)
		} else {
			return this.addMessage(message)
		}
	}

	addCommandResponse(commandMessage: ServerConsoleMessage, message: CommandResponse) {
		const msg = this.parseMessage(message)
		const pendingResponses = this.pendingCommandResponses.get(commandMessage)
		if (pendingResponses) {
			pendingResponses.push(msg)
		} else {
			this.pendingCommandResponses.set(commandMessage, [msg])
		}
		this.schedulePendingFlush()
	}

	async tryPopulateConsole(server: RustServer) {
		if (this.isPopulatedConsole) {
			return
		}

		const response = await server.sendCommandGetResponse(`console.tail ${this.config.consoleHistoryFetch}`)
		if (!response) {
			return // TODO: handle error
		}

		const junkyard: ServerConsoleMessage[] = []

		try {
			const messages = JSON.parse(response.Message) as HistoryMessage[]
			junkyard.push(...messages.map(this.parseHistoryMessage.bind(this)))
		} catch (error) {
			console.error(error)
		}

		if (this.config.consoleChatInclude) {
			const responseChat = await server.sendCommandGetResponse(
				`chat.tail ${this.config.consoleChatHistoryFetch}`
			)
			if (!responseChat) {
				this.pushMessages(junkyard)
				this.isPopulatedConsole = true
				console.error('Failed to get chat.tail')
				return // TODO: handle error
			}

			const messagesChat = parseChatEntries(responseChat)
			if (messagesChat) {
				junkyard.push(...messagesChat.map(this.parseChatMessage.bind(this)))
			}
		}

		this.pushMessages(junkyard.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()))

		this.isPopulatedConsole = true
	}

	onMessageGeneral(msg: CommandResponse) {
		// console.log(msg)
		this.addMessage(msg)
	}

	onMessagePlayerRelated(msg: CommandResponse) {
		// console.log('onMessagePlayerRelated', msg)
		switch (msg.Type) {
			case LogType.Chat:
				this.addChatMessageFromCommandResponse(msg)
				break
			default:
				this.addMessage(msg)
				break
		}
	}

	trySubscribeToMessagesGeneral(server: RustServer) {
		if (this.unsubscribeOnMessagesGeneral) {
			return
		}
		this.unsubscribeOnMessagesGeneral = server.subscribeOnMessageGeneral(
			`console_${server.id}`,
			this.onMessageGeneral.bind(this)
		)
	}

	trySubscribeToMessagesPlayerRelated(server: RustServer) {
		if (!this.config.consoleChatInclude) {
			return
		}

		if (this.unsubscribeOnMessagesPlayerRelated) {
			return
		}
		this.unsubscribeOnMessagesPlayerRelated = server.subscribeOnMessagePlayerRelated(
			`console_${server.id}`,
			this.onMessagePlayerRelated.bind(this)
		)
	}

	destroy() {
		this.unsubscribeOnMessagesGeneral?.()
		this.unsubscribeOnMessagesGeneral = null
		this.unsubscribeOnMessagesPlayerRelated?.()
		this.unsubscribeOnMessagesPlayerRelated = null
		if (this.pendingFrameHandle != null) {
			cancelScheduledFrame(this.pendingFrameHandle)
			this.pendingFrameHandle = null
		}
		this.pendingMessages = []
		this.pendingCommandResponses.clear()
		this.messages.length = 0
	}
}

function createServerConsoleStore(id: number, config: ConfigGlobal): ServerConsoleStore {
	const store = new ServerConsoleStore(config)
	map.set(id, store)
	return store
}

export function removeServerConsoleStore(id: number): boolean {
	const store = map.get(id)
	if (store) {
		store.destroy()
	}
	return map.delete(id)
}

export function getServerConsoleStore(id: number, config: ConfigGlobal): ServerConsoleStore {
	const store = map.get(id)
	if (store) {
		return store
	}
	return createServerConsoleStore(id, config)
}
