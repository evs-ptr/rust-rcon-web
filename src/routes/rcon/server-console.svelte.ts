import { LogType, type CommandResponse } from './rust-rcon'
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

	public response: ServerConsoleMessage | null = $state.raw(null)

	constructor(message: string, type: ServerConsoleMessageType, consoleType: LogType) {
		this.id = ServerConsoleMessage.idCounter++
		this.text = message
		this.type = type
		this.logType = consoleType
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

	addMessageRaw(message: string, type: ServerConsoleMessageType, consoleType: LogType = LogType.Generic) {
		const msg = new ServerConsoleMessage(message, type, consoleType)
		this.messages.push(msg)
		return msg
	}

	parseMessage(message: CommandResponse) {
		return new ServerConsoleMessage(message.Message, ServerConsoleMessageType.Console, message.Type)
	}

	addMessage(message: CommandResponse) {
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

		// TODO: handle error
		const messages = JSON.parse(response.Message)
		for (const message of messages) {
			this.addMessage(message)
		}

		this.isPopulatedConsole = true
	}

	onMessageGeneral(msg: CommandResponse) {
		// console.log(msg)
		this.addMessage(msg)
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
