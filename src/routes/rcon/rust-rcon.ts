import type { CommandResponse, CommandSend } from './rust-rcon.types'
import { WebSocketWrapper } from './websocket-wrapper'

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

	private readonly messagesMapMany = new Map<number, (msg: CommandResponse) => void>()

	private readonly subscriptionsOnMessageGeneral: Map<string, (msg: CommandResponse) => void> = new Map()
	private readonly subscriptionsOnMessagePlayerRelated: Map<string, (msg: CommandResponse) => void> =
		new Map()
	private readonly subscriptionsOnMessageCommand: Map<string, (msg: CommandResponse) => void> = new Map()

	constructor(url: string) {
		super(url)
	}

	disconnect() {
		super.disconnect()
		this.messagesMap.clear()
		this.messagesMapMany.clear()
		this.subscriptionsOnMessageGeneral.clear()
		this.subscriptionsOnMessagePlayerRelated.clear()
		this.subscriptionsOnMessageCommand.clear()
	}

	onMessage(event: MessageEvent) {
		super.onMessage(event)

		const data = event.data as string

		try {
			const msg = JSON.parse(data) as CommandResponse

			const resolve = this.messagesMap.get(msg.Identifier)
			if (resolve) {
				this.messagesMap.delete(msg.Identifier)
				resolve(msg)
				return
			}

			const callbackMany = this.messagesMapMany.get(msg.Identifier)
			if (callbackMany) {
				callbackMany(msg)
				return
			}

			if (msg.Identifier === 0) {
				this.subscriptionsOnMessageGeneral.forEach((onMessage) => onMessage(msg))
			} else if (msg.Identifier === -1) {
				this.subscriptionsOnMessagePlayerRelated.forEach((onMessage) => onMessage(msg))
			} else if (msg.Identifier === MSG_ID_REG_COMMAND) {
				this.subscriptionsOnMessageCommand.forEach((onMessage) => onMessage(msg))
			}

			console.log('unknown message', msg)
		} catch (error) {
			console.error('Failed to parse message:', error)
		}
	}

	subscribeOnMessageGeneral(subscribeId: string, onMessageGeneral: (msg: CommandResponse) => void) {
		this.subscriptionsOnMessageGeneral.set(subscribeId, onMessageGeneral)
		return () => this.subscriptionsOnMessageGeneral.delete(subscribeId)
	}

	subscribeOnMessagePlayerRelated(
		subscribeId: string,
		onMessagePlayerRelated: (msg: CommandResponse) => void
	) {
		this.subscriptionsOnMessagePlayerRelated.set(subscribeId, onMessagePlayerRelated)
		return () => this.subscriptionsOnMessagePlayerRelated.delete(subscribeId)
	}

	subscribeOnMessageCommand(subscribeId: string, onMessageCommand: (msg: CommandResponse) => void) {
		this.subscriptionsOnMessageCommand.set(subscribeId, onMessageCommand)
		return () => this.subscriptionsOnMessageCommand.delete(subscribeId)
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

	sendCommandGetResponsesMany(
		command: string,
		callback: (msg: CommandResponse) => void,
		timeout: number = 5_000
	): void {
		const msgId = this.takeNextMsgId()
		const msg = this.constructMessage(command, msgId)
		const serialized = JSON.stringify(msg)

		this.messagesMapMany.set(msgId, callback)

		setTimeout(() => {
			this?.messagesMapMany?.delete(msgId)
		}, timeout)

		this.send(serialized)
	}

	sendCommand(command: string) {
		const msg = this.constructMessage(command, MSG_ID_REG_COMMAND)
		const serialized = JSON.stringify(msg)
		// console.log('sendCommand', serialized)
		return this.send(serialized)
	}
}
