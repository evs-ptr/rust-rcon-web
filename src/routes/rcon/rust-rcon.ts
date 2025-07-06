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

export class RustRconConnection extends WebSocketWrapper {
	private msgIdNext = 696

	private readonly messagesMap = new Map<
		number,
		(value: CommandResponse | PromiseLike<CommandResponse>) => void
	>()
	private readonly messageTimeOut = 6_000

	constructor(url: string) {
		super(url)
	}

	onMessage(event: MessageEvent) {
		super.onMessage(event)

		const data = event.data as string

		const msg = JSON.parse(data) as CommandResponse
		const resolve = this.messagesMap.get(msg.Identifier)
		if (resolve) {
			this.messagesMap.delete(msg.Identifier)
			resolve(msg)
		}
		console.log('onMessage', msg)
	}

	async sendCommand(command: string): Promise<CommandResponse> {
		const msgId = this.msgIdNext
		this.msgIdNext += 1

		const promise1 = new Promise((resolve, reject) => {
			const msg = {
				Message: command,
				Identifier: msgId,
			} satisfies CommandSend

			const serialized = JSON.stringify(msg)

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
}
