import { LogType, type CommandResponse } from './rust-rcon.types'
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

	public readonly text: string
	public readonly type: ServerConsoleMessageType
	public readonly logType: LogType

	public readonly timestamp: Date

	public responses: ServerConsoleMessage[] | null = $state(null)

	constructor(message: string, type: ServerConsoleMessageType, consoleType: LogType, timestamp: Date) {
		this.id = ServerConsoleMessage.idCounter++
		this.text = message
		this.type = type
		this.logType = consoleType
		this.timestamp = timestamp
	}
}

export class ServerConsoleStore {
	// TODO: make it NOT deep
	public readonly messages: ServerConsoleMessage[] = $state([])
	public commandInput: string = $state('')

	public lastScrollTop: number | null = null
	public lastShouldScroll: boolean | null = null

	private isPopulatedConsole: boolean = false
	private unsubscribeOnMessagesGeneral: (() => void) | null = null
	private unsubscribeOnMessagesPlayerRelated: (() => void) | null = null

	addMessageRaw(message: string, type: ServerConsoleMessageType, consoleType: LogType = LogType.Generic) {
		const timestamp = new Date()
		const msg = new ServerConsoleMessage(message, type, consoleType, timestamp)
		this.messages.push(msg)
		return msg
	}

	parseMessage(message: CommandResponse) {
		// as we don't have this info in CommandResponse
		const timestamp = new Date()
		return new ServerConsoleMessage(
			message.Message,
			ServerConsoleMessageType.Console,
			message.Type,
			timestamp
		)
	}

	addMessage(message: CommandResponse): ServerConsoleMessage {
		const msg = this.parseMessage(message)
		this.messages.push(msg)
		return msg
	}

	addChatMessage(message: CommandResponse): ServerConsoleMessage {
		const msg = this.parseMessage(message)
		this.messages.push(msg)
		return msg
	}

	async tryPopulateConsole(server: RustServer) {
		if (this.isPopulatedConsole) {
			return
		}

		const response = await server.sendCommandGetResponse('console.tail 200')
		if (!response) {
			return // TODO: handle error
		}

		try {
			//  {
			//     "Message": "Saved 640 ents, cache(0.00), write(0.00), disk(0.01).",
			//     "Stacktrace": "",
			//     "Type": "Log",
			//     "Time": 1752068442
			//   },

			// TODO: to ConsoleHistoryEntry
			const messages = JSON.parse(response.Message)
			for (const message of messages) {
				this.addMessage(message)
			}

			this.isPopulatedConsole = true
		} catch (error) {
			console.error(error)
		}

		// TODO: get chat too, sort by time, only then add
	}

	onMessageGeneral(msg: CommandResponse) {
		// console.log(msg)
		this.addMessage(msg)
	}

	onMessagePlayerRelated(msg: CommandResponse) {
		console.log('onMessagePlayerRelated', msg)
		switch (msg.Type) {
			case LogType.Chat:
				this.addChatMessage(msg)
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
		this.messages.length = 0
	}
}

function createServerConsoleStore(id: number): ServerConsoleStore {
	const store = new ServerConsoleStore()
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

export function getServerConsoleStore(id: number): ServerConsoleStore {
	const store = map.get(id)
	if (store) {
		return store
	}
	return createServerConsoleStore(id)
}
