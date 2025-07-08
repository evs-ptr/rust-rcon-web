import { WebSocketWrapper } from './websocket-wrapper'
export interface CommandSend {
	Message: string
	Identifier: number
}

export interface CommandResponse {
	Message: string
	Identifier: number
	Type: LogType
	Stacktrace: string
}

export enum LogType {
	Generic = 0,
	Error = 1,
	Warning = 2,
	Chat = 3,
	Report = 4,
	ClientPerf = 5,
	Subscription = 6,
}

const MAX_INT_32 = 2_147_483_647
const MIN_INT_32 = -2_147_483_648

const MSG_ID_SAFE_START = 1699
const MSG_ID_REG_COMMAND = -698

export class RustRconConnection extends WebSocketWrapper {
	private msgIdNext: number = MIN_INT_32

	private readonly messagesMap = new Map<
		number,
		(value: CommandResponse | PromiseLike<CommandResponse>) => void
	>()
	private readonly messageTimeOut = 6_000

	private readonly subscriptions: Map<string, (msg: CommandResponse) => void> = new Map()

	constructor(url: string) {
		super(url)
	}

	disconnect() {
		super.disconnect()
		this.messagesMap.clear()
		this.subscriptions.clear()
	}

	onMessage(event: MessageEvent) {
		super.onMessage(event)

		const data = event.data as string

		// TODO: handle error
		const msg = JSON.parse(data) as CommandResponse
		const resolve = this.messagesMap.get(msg.Identifier)
		if (resolve) {
			this.messagesMap.delete(msg.Identifier)
			resolve(msg)
			return
		}

		this.subscriptions.forEach((onMessage) => onMessage(msg))
	}

	subscribeOnMessage(subscribeId: string, onMessage: (msg: CommandResponse) => void) {
		this.subscriptions.set(subscribeId, onMessage)
		return () => this.subscriptions.delete(subscribeId)
	}

	private takeNextMsgId(): number {
		const current = this.msgIdNext

		if (current >= MAX_INT_32 - 1) {
			this.msgIdNext = MIN_INT_32
		} else if (current >= MSG_ID_REG_COMMAND - 1 && current < MSG_ID_SAFE_START) {
			this.msgIdNext = MSG_ID_SAFE_START // skipping common ones
		} else {
			this.msgIdNext += 1
		}

		return current
	}

	constructMessage(command: string, msgId: number): CommandSend {
		return {
			Message: command,
			Identifier: msgId,
		} satisfies CommandSend
	}

	async sendCommandGetResponse(command: string): Promise<CommandResponse> {
		const msgId = this.takeNextMsgId()

		const promise1 = new Promise((resolve, reject) => {
			const msg = this.constructMessage(command, msgId)
			const serialized = JSON.stringify(msg)

			console.log('sendCommandGetResponse', serialized)

			if (this.send(serialized)) {
				this.messagesMap.set(msgId, resolve)
			} else {
				reject(new Error('Failed to send message'))
			}
		})

		const promise2 = new Promise((_, reject) => {
			setTimeout(() => {
				if (this.messagesMap.delete(msgId)) {
					reject(new Error('Timed out waiting for response'))
				}
			}, this.messageTimeOut)
		})

		return Promise.race([promise1, promise2]) as Promise<CommandResponse>
	}

	sendCommand(command: string) {
		const msg = this.constructMessage(command, MSG_ID_REG_COMMAND)
		const serialized = JSON.stringify(msg)
		console.log('sendCommand', serialized)
		return this.send(serialized)
	}
}
