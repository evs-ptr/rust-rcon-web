import type { ConfigGlobal } from '$lib/config-global.svelte'
import { CommandHistory } from './command-history.svelte'
import { LogType, type ChatEntry, type CommandResponse, type HistoryMessage } from './rust-rcon.types'
import type { RustServer } from './rust-server.svelte'

const map = new Map<number, ServerConsoleStore>()

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

	public readonly history: CommandHistory = new CommandHistory()

	public lastScrollTop: number | null = null
	public lastShouldScroll: boolean | null = null
	public lastContainerHeight: string | null = null

	private isPopulatedConsole: boolean = false
	private unsubscribeOnMessagesGeneral: (() => void) | null = null
	private unsubscribeOnMessagesPlayerRelated: (() => void) | null = null

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
	}

	private pushMessages(msgs: ServerConsoleMessage[]) {
		this.clampMessagesIfNeeded(msgs.length)
		this.messages.push(...msgs)
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
		this.pushMessage(msg)
		return msg
	}

	addHistoryMessage(message: HistoryMessage) {
		const msg = this.parseHistoryMessage(message)
		this.pushMessage(msg)
		return msg
	}

	addChatMessage(message: ChatEntry): ServerConsoleMessage {
		const msg = this.parseChatMessage(message)
		this.pushMessage(msg)
		return msg
	}

	addChatMessageFromCommandResponse(message: CommandResponse): ServerConsoleMessage {
		try {
			const chatEntry = JSON.parse(message.Message) as ChatEntry
			return this.addChatMessage(chatEntry)
		} catch (error) {
			console.error(error)
			return this.addMessage(message)
		}
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

			try {
				const messagesChat = JSON.parse(responseChat.Message) as ChatEntry[]
				junkyard.push(...messagesChat.map(this.parseChatMessage.bind(this)))
			} catch (error) {
				console.error(error)
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
