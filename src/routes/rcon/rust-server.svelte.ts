import { RustRconConnection } from './rust-rcon'

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
			console.error(e)
			return false
		}

		this.connectionWasEstablished = true

		return true
	}
}
