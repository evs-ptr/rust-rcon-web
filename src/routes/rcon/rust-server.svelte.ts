import type { ConfigServer } from '$lib/config-server.svelte'
import { RustRconConnection } from './rust-rcon'
import type { CommandResponse } from './rust-rcon.types'

export class RustServer {
	private static idCounter = 0
	public readonly id: number

	public readonly configServer: ConfigServer

	public connectionWasEstablished: boolean = $state(false)

	public displayName: string

	public isOxide: boolean = $state(false)
	public isCarbon: boolean = $state(false)

	private rcon: RustRconConnection | null = $state(null)

	constructor(configServer: ConfigServer) {
		this.configServer = configServer
		this.id = RustServer.idCounter++

		this.displayName = $derived(configServer.address || this.getRandomEmoji())
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

		if (!this.configServer.address || !this.configServer.password) {
			return false
		}

		const url = `${this.configServer.useSecureWebsocket ? 'wss' : 'ws'}://${this.configServer.address}/${this.configServer.password}`

		try {
			this.rcon = new RustRconConnection(url)
			await this.rcon.connect()
		} catch (e) {
			this.cleanUp()
			throw e
		}

		this.connectionWasEstablished = true

		this.updateFrameworkFlags()

		return true
	}

	private updateFrameworkFlags() {
		this.sendCommandGetResponse('o.version')
			.then(() => (this.isOxide = true))
			.catch(() => (this.isOxide = false))
		this.sendCommandGetResponse('c.version')
			.then(() => (this.isCarbon = true))
			.catch(() => (this.isCarbon = false))
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

	private getRandomEmoji() {
		const em: string[] = [
			'༼⌐■ل͟■༽',
			'(。﹏。*)',
			'( ͡°- ͡°)',
			'T ʖ̯ T',
			'(ㆆ_ㆆ)',
			'ʕ ͡° ᴥ ͡°ʔ',
			'༼▀̿̿Ĺ̯̿̿▀̿ ̿༽=ε/̵͇̿̿/’̿’̿ ̿ ̿̿ ̿̿ ̿̿༼ ຈل͜ຈ༽',
			'•‿•',
			'( ͡°ε ͡°)',
			'( ° ͜ʖ °)',
			'( ͠° ͟ʖ ͡°)',
			'( ͡ᵔ ͜ʖ ͡ᵔ )',
			'（￣～￣;）',
			'(╯°□°）╯︵ ┻━┻',
			'(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
			'(⌐■_■)',
			"(ง'̀-'́)ง",
			'[¬º-°]¬',
		]
		const index = Math.floor(Math.random() * em.length)
		return em[index]
	}
}
