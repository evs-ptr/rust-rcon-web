import { RustRconConnection } from './rust-rcon'
import type { CommandResponse } from './rust-rcon.types'

export class RustServer {
	private static idCounter = 0
	public readonly id: number

	public ipPort: string = $state('')
	public password: string = $state('')
	public useSecureWebSocket: boolean = $state(false)

	public connectionWasEstablished: boolean = $state(false)

	private rcon: RustRconConnection | null = $state(null)

	constructor() {
		this.id = RustServer.idCounter++
	}

	cleanUp() {
		if (this.rcon) {
			this.rcon.disconnect()
			this.rcon = null
		}
	}

	async connect() {
		if (this.connectionWasEstablished) {
			return true
		}

		if (!this.ipPort || !this.password) {
			return false
		}

		const url = `${this.useSecureWebSocket ? 'wss' : 'ws'}://${this.ipPort}/${this.password}`

		try {
			this.rcon = new RustRconConnection(url)
			await this.rcon.connect()
		} catch (e) {
			this.cleanUp()
			throw e
		}

		this.connectionWasEstablished = true

		return true
	}

	subscribeOnMessageGeneral(subscribeId: string, onMessage: (msg: CommandResponse) => void) {
		if (!this.rcon || !this.connectionWasEstablished) {
			return () => {}
		}
		return this.rcon.subscribeOnMessageGeneral(subscribeId, onMessage)
	}

	subscribeOnMessagePlayerRelated(subscribeId: string, onMessage: (msg: CommandResponse) => void) {
		if (!this.rcon || !this.connectionWasEstablished) {
			return () => {}
		}
		return this.rcon.subscribeOnMessagePlayerRelated(subscribeId, onMessage)
	}

	async sendCommandGetResponse(command: string) {
		if (!this.rcon || !this.connectionWasEstablished) {
			return
		}
		return this.rcon.sendCommandGetResponse(command)
	}

	sendCommandGetResponsesMany(command: string, callback: (msg: CommandResponse) => void) {
		if (!this.rcon || !this.connectionWasEstablished) {
			return
		}
		return this.rcon.sendCommandGetResponsesMany(command, callback)
	}

	sendCommand(command: string) {
		if (!this.rcon || !this.connectionWasEstablished) {
			return
		}
		return this.rcon.sendCommand(command)
	}
}
