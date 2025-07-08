import { LogType, type CommandResponse } from './rust-rcon'

const map = new Map<number, ServerConsoleStore>()

export enum ServerConsoleMessageType {
	Console = 0,
	UserCommand = 1,
}

export class ServerConsoleMessage {
	public readonly text: string
	public readonly type: ServerConsoleMessageType
	public readonly logType: LogType

	constructor(message: string, type: ServerConsoleMessageType, consoleType: LogType) {
		this.text = message
		this.type = type
		this.logType = consoleType
	}
}

export class ServerConsoleStore {
	public readonly messages: ServerConsoleMessage[] = $state([])
	public commandInput: string = $state('')

	addMessageRaw(
		message: string,
		type: ServerConsoleMessageType,
		consoleType: LogType = LogType.Generic
	) {
		const msg = new ServerConsoleMessage(message, type, consoleType)
		this.messages.push(msg)
		return msg
	}

	addMessage(message: CommandResponse) {
		const msg = new ServerConsoleMessage(
			message.Message,
			ServerConsoleMessageType.Console,
			message.Type
		)
		this.messages.push(msg)
		return msg
	}
}

function createServerConsoleStore(id: number): ServerConsoleStore {
	const store = new ServerConsoleStore()
	map.set(id, store)
	return store
}

export function removeServerConsoleStore(id: number): boolean {
	return map.delete(id)
}

export function getServerConsoleStore(id: number): ServerConsoleStore {
	const store = map.get(id)
	if (store) {
		return store
	}
	return createServerConsoleStore(id)
}
