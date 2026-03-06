import type { ConfigServer } from '$lib/config-server.svelte'
import { RustRconConnection } from './rust-rcon'
import type { CommandResponse } from './rust-rcon.types'
import { WebSocketConnectionStatus, type WebSocketLifecycleEvent } from './websocket-wrapper'

export class RustServer {
	private static idCounter = 0
	public readonly id: number

	public readonly configServer: ConfigServer

	public connectionWasEstablished: boolean = $state(false)
	public connectionStatus: WebSocketConnectionStatus = $state(WebSocketConnectionStatus.Idle)
	public reconnectAttempt: number = $state(0)
	public reconnectDelayMs: number | null = $state(null)
	public lastDisconnectCode: number | null = $state(null)
	public lastDisconnectReason: string | null = $state(null)
	public lastConnectedAt: Date | null = $state(null)
	public lastMessageAt: Date | null = $state(null)
	public hasReceivedMessageSinceConnect: boolean = $state(false)
	public lastLifecycleEvent: WebSocketLifecycleEvent | null = $state(null)

	public displayName: string

	public isOxide: boolean = $state(false)
	public isCarbon: boolean = $state(false)

	private rcon: RustRconConnection | null = $state(null)
	private unsubscribeOnLifecycle: (() => void) | null = null
	private unsubscribeOnMessageActivity: (() => void) | null = null

	constructor(configServer: ConfigServer) {
		this.configServer = configServer
		this.id = RustServer.idCounter++

		this.displayName = $derived(configServer.address || this.getRandomEmoji())
	}

	cleanUp() {
		this.unsubscribeOnLifecycle?.()
		this.unsubscribeOnLifecycle = null
		this.unsubscribeOnMessageActivity?.()
		this.unsubscribeOnMessageActivity = null

		if (this.rcon) {
			this.rcon.disconnect()
			this.rcon = null
		}
	}

	async connect() {
		if (this.connectionStatus === WebSocketConnectionStatus.Connected) {
			return true
		}

		if (
			(this.connectionStatus === WebSocketConnectionStatus.Connecting ||
				this.connectionStatus === WebSocketConnectionStatus.Reconnecting) &&
			this.rcon
		) {
			await this.rcon.connect()
			return true
		}

		if (!this.configServer.address || !this.configServer.password) {
			return false
		}

		const url = `${this.configServer.useSecureWebsocket ? 'wss' : 'ws'}://${this.configServer.address}/${this.configServer.password}`

		try {
			this.cleanUp()
			this.rcon = new RustRconConnection(url)
			this.bindConnection(this.rcon)
			await this.rcon.connect()
		} catch (e) {
			this.cleanUp()
			throw e
		}

		this.connectionWasEstablished = true

		this.updateFrameworkFlags()

		return true
	}

	private bindConnection(rcon: RustRconConnection) {
		this.unsubscribeOnLifecycle?.()
		this.unsubscribeOnLifecycle = rcon.subscribeOnLifecycle(`server_lifecycle_${this.id}`, (event) => {
			this.lastLifecycleEvent = event
			this.connectionStatus = event.status
			this.reconnectAttempt = event.attempt
			this.reconnectDelayMs = event.delayMs

			switch (event.status) {
				case WebSocketConnectionStatus.Connected:
					this.connectionWasEstablished = true
					this.lastConnectedAt = event.at
					this.hasReceivedMessageSinceConnect = false
					this.lastDisconnectCode = null
					this.lastDisconnectReason = null
					this.reconnectAttempt = 0
					this.reconnectDelayMs = null
					if (event.wasReconnect) {
						this.updateFrameworkFlags()
					}
					break
				case WebSocketConnectionStatus.Reconnecting:
				case WebSocketConnectionStatus.Disconnected:
				case WebSocketConnectionStatus.ReconnectFailed:
					this.lastDisconnectCode = event.closeCode
					this.lastDisconnectReason = event.reason
					if (event.status !== WebSocketConnectionStatus.Reconnecting) {
						this.reconnectDelayMs = null
					}
					break
				default:
					break
			}
		})

		this.unsubscribeOnMessageActivity?.()
		this.unsubscribeOnMessageActivity = rcon.subscribeOnMessageActivity(
			`server_message_activity_${this.id}`,
			(_msg, at) => {
				this.hasReceivedMessageSinceConnect = true
				this.lastMessageAt = at
			}
		)
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

	canSendCommands() {
		return this.connectionStatus === WebSocketConnectionStatus.Connected
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
