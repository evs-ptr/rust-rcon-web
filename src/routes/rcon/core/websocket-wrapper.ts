export enum WebSocketConnectionStatus {
	Idle = 'idle',
	Connecting = 'connecting',
	Connected = 'connected',
	Reconnecting = 'reconnecting',
	Disconnected = 'disconnected',
	ReconnectFailed = 'reconnect_failed',
}

export interface WebSocketLifecycleEvent {
	status: WebSocketConnectionStatus
	at: Date
	attempt: number
	delayMs: number | null
	closeCode: number | null
	reason: string | null
	error: Error | Event | null
	wasReconnect: boolean
}

export class WebSocketWrapper {
	private url: string
	private ws: WebSocket | null = null

	public isConnected = false
	public shouldReconnect = true
	public connectionStatus = WebSocketConnectionStatus.Idle

	private reconnectAttempts = 0
	private maxReconnectAttempts = 50
	private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
	private baseReconnectDelay = 1000
	private reconnectDelayMultiplier = 1.25

	private connectTimeout = 5000
	private connectPromise: Promise<unknown> | null = null
	private connectResolve: ((value: unknown) => void) | null = null
	private connectReject: ((reason: Error) => void) | null = null
	private lastCloseCode: number | null = null
	private lastCloseReason: string | null = null
	private hasConnectedBefore = false
	private lifecycleListeners = new Map<string, (event: WebSocketLifecycleEvent) => void>()

	constructor(url: string) {
		this.url = url
	}

	subscribeOnLifecycle(subscribeId: string, onLifecycle: (event: WebSocketLifecycleEvent) => void) {
		this.lifecycleListeners.set(subscribeId, onLifecycle)
		onLifecycle(this.createLifecycleEvent(this.connectionStatus))
		return () => this.lifecycleListeners.delete(subscribeId)
	}

	private createLifecycleEvent(
		status: WebSocketConnectionStatus,
		overrides: Partial<Omit<WebSocketLifecycleEvent, 'status' | 'at'>> = {}
	): WebSocketLifecycleEvent {
		return {
			status,
			at: new Date(),
			attempt: this.reconnectAttempts,
			delayMs: null,
			closeCode: this.lastCloseCode,
			reason: this.lastCloseReason,
			error: null,
			wasReconnect: this.hasConnectedBefore || this.reconnectAttempts > 0,
			...overrides,
		}
	}

	private emitLifecycle(
		status: WebSocketConnectionStatus,
		overrides: Partial<Omit<WebSocketLifecycleEvent, 'status' | 'at'>> = {}
	) {
		this.connectionStatus = status
		const event = this.createLifecycleEvent(status, overrides)
		this.lifecycleListeners.forEach((listener) => listener(event))
	}

	connect(): Promise<unknown> {
		if (this.connectPromise) {
			return this.connectPromise
		}

		if (this.isConnected) {
			// If we are already connected, we can consider the "connection" process
			// successful. We should return the original promise if it exists,
			// to allow for consistent `await` behavior for callers who might have
			// missed the initial connection.
			return this.connectPromise ?? Promise.resolve()
		}

		this.shouldReconnect = true
		if (this.reconnectAttempts === 0) {
			this.emitLifecycle(WebSocketConnectionStatus.Connecting)
		}

		const promise1 = new Promise((resolve, reject) => {
			this.ws = new WebSocket(this.url)
			this.connectResolve = resolve
			this.connectReject = reject
			this.bindEvents()
		})
		const promise2 = new Promise((_, reject) => {
			setTimeout(() => {
				if (!this.isConnected) {
					reject(new Error('Timed out connecting to websocket'))
				}
			}, this.connectTimeout)
		})

		this.connectPromise = Promise.race([promise1, promise2]).catch((error) => {
			if (this.ws) {
				// Prevent onclose from triggering a reconnect attempt
				this.unbindEvents()
				this.ws.close()
			}
			this.resetState()
			this.emitLifecycle(WebSocketConnectionStatus.Disconnected, {
				error: error as Error,
				wasReconnect: this.reconnectAttempts > 0,
			})
			throw error
		})
		return this.connectPromise
	}

	private resetState() {
		this.isConnected = false
		this.connectPromise = null
		this.connectResolve = null
		this.connectReject = null
		this.ws = null
	}

	private async handleReconnect() {
		if (!this.shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('Max reconnection attempts reached or reconnection disabled')
			this.emitLifecycle(WebSocketConnectionStatus.ReconnectFailed)
			return
		}

		this.reconnectAttempts++
		const delay = this.getReconnectDelay(this.reconnectAttempts)

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout)
		}

		this.emitLifecycle(WebSocketConnectionStatus.Reconnecting, {
			attempt: this.reconnectAttempts,
			delayMs: delay,
			wasReconnect: true,
		})

		this.reconnectTimeout = setTimeout(async () => {
			try {
				await this.connect()
			} catch (error) {
				console.error('Reconnection failed:', error)
				this.handleReconnect()
			}
		}, delay)
	}

	private getReconnectDelay(attempt: number) {
		return Math.min(
			Math.round(this.baseReconnectDelay * Math.pow(this.reconnectDelayMultiplier, attempt - 1)),
			10_000
		)
	}

	private bindEvents() {
		if (!this.ws) {
			return
		}

		this.ws.onopen = this.onOpen.bind(this)
		this.ws.onmessage = this.onMessage.bind(this)
		this.ws.onerror = this.onError.bind(this)
		this.ws.onclose = this.onClose.bind(this)
	}

	private unbindEvents() {
		if (!this.ws) {
			return
		}

		this.ws.onopen = null
		this.ws.onmessage = null
		this.ws.onerror = null
		this.ws.onclose = null
	}

	disconnect(): void {
		if (!this.ws) {
			return
		}

		this.shouldReconnect = false // Prevent reconnection on manual disconnect

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout)
			this.reconnectTimeout = null
		}

		this.unbindEvents()
		this.ws.close(1000, 'done')
		this.lastCloseCode = 1000
		this.lastCloseReason = 'Disconnected manually'
		this.resetState()
		this.emitLifecycle(WebSocketConnectionStatus.Disconnected, { wasReconnect: false })
	}

	onOpen() {
		this.isConnected = true
		const wasReconnect = this.hasConnectedBefore || this.reconnectAttempts > 0
		this.hasConnectedBefore = true
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout)
			this.reconnectTimeout = null
		}
		this.emitLifecycle(WebSocketConnectionStatus.Connected, {
			wasReconnect,
			attempt: this.reconnectAttempts,
			delayMs: null,
			closeCode: null,
			reason: null,
		})
		this.reconnectAttempts = 0
		this.lastCloseCode = null
		this.lastCloseReason = null
		this.connectResolve?.(undefined)
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onMessage(_event: MessageEvent) {
		// ignore
	}

	onError(event: Event) {
		// In non-browser environments (like vitest in node), ErrorEvent may not be defined.
		const error = typeof ErrorEvent !== 'undefined' && event instanceof ErrorEvent ? event.error : event
		console.error('WebSocket error:', error)
		this.connectReject?.(error as Error)
	}

	onClose(event: CloseEvent) {
		this.lastCloseCode = event.code
		this.lastCloseReason = event.reason || null
		this.resetState()

		// Don't reconnect if it was a normal closure
		if (event.code !== 1000 && this.shouldReconnect) {
			this.emitLifecycle(WebSocketConnectionStatus.Disconnected)
			this.handleReconnect()
			return
		}

		this.emitLifecycle(WebSocketConnectionStatus.Disconnected)
	}

	send(data: string | ArrayBufferLike | Blob | ArrayBufferView): boolean {
		if (!this.ws || !this.isConnected) {
			console.warn('Attempted to send message while disconnected')
			return false
		}
		try {
			this.ws.send(data)
			return true
		} catch (error) {
			console.error('Failed to send message:', error)
			return false
		}
	}
}
