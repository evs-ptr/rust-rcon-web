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

enum LogType {
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

export class RustRconConnection extends WebSocketWrapper {
	private msgIdNext: number = MAX_INT_32 - 1

	private readonly messagesMap = new Map<
		number,
		(value: CommandResponse | PromiseLike<CommandResponse>) => void
	>()
	private readonly messageTimeOut = 6_000

	constructor(url: string) {
		super(url)
	}

	disconnect() {
		super.disconnect()
		this.messagesMap.clear()
	}

	onMessage(event: MessageEvent) {
		super.onMessage(event)

		const data = event.data as string

		const msg = JSON.parse(data) as CommandResponse
		const resolve = this.messagesMap.get(msg.Identifier)
		if (resolve) {
			this.messagesMap.delete(msg.Identifier)
			resolve(msg)
			return
		}
		console.log('onMessage', msg)
	}

	private takeNextMsgId(): number {
		const current = this.msgIdNext

		if (current >= MAX_INT_32 - 1) {
			this.msgIdNext = MIN_INT_32
		} else if (current == -1) {
			this.msgIdNext = 69 // skipping common ones
		} else {
			this.msgIdNext += 1
		}

		return current
	}

	constructMessage(command: string): CommandSend {
		const msgId = this.takeNextMsgId()
		return {
			Message: command,
			Identifier: msgId,
		} satisfies CommandSend
	}

	async sendCommandGetResponse(command: string): Promise<CommandResponse> {
		const msg = this.constructMessage(command)

		const promise1 = new Promise((resolve, reject) => {
			const serialized = JSON.stringify(msg)

			console.log('sendCommandGetResponse', serialized)

			if (this.send(serialized)) {
				this.messagesMap.set(msg.Identifier, resolve)
			} else {
				reject(new Error('Failed to send message'))
			}
		})

		const promise2 = new Promise((_, reject) => {
			setTimeout(() => {
				if (this.messagesMap.delete(msg.Identifier)) {
					reject(new Error('Timed out waiting for response'))
				}
			}, this.messageTimeOut)
		})

		return Promise.race([promise1, promise2]) as Promise<CommandResponse>
	}
}
