export class WebSocketWrapper {
	private url: string
	private ws: WebSocket | null = null

	public isConnected = false
	public shouldReconnect = true

	private reconnectAttempts = 0
	private maxReconnectAttempts = 50
	private reconnectTimeout: number | null = null
	private baseReconnectDelay = 1000

	private connectTimeout = 5000
	private connectPromise: Promise<unknown> | null = null
	private connectResolve: ((value: unknown) => void) | null = null
	private connectReject: ((reason: Error) => void) | null = null

	constructor(url: string) {
		this.url = url
	}

	async connect(): Promise<unknown> {
		if (this.connectPromise) {
			return this.connectPromise
		}

		if (this.isConnected) {
			return Promise.resolve()
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
			return
		}

		this.reconnectAttempts++
		const delay = Math.min(
			this.baseReconnectDelay * Math.pow(1.3, this.reconnectAttempts - 1),
			15_000
		)

		console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout)
		}

		this.reconnectTimeout = setTimeout(async () => {
			try {
				await this.connect()
				this.reconnectAttempts = 0 // Reset on successful connection
			} catch (error) {
				console.error('Reconnection failed:', error)
				this.handleReconnect()
			}
		}, delay)
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
		this.resetState()
		console.log('WebSocket disconnected')
	}

	onOpen() {
		this.isConnected = true
		this.connectResolve?.(undefined)
		console.log('WebSocket connected successfully')
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onMessage(_event: MessageEvent) {
		// ignore
	}

	onError(event: Event) {
		const error = event instanceof ErrorEvent ? event.error : event
		console.error('WebSocket error:', error)
		this.connectReject?.(error as Error)
	}

	onClose(event: CloseEvent) {
		console.log(`WebSocket closed: ${event.code} - ${event.reason}`)
		this.resetState()

		// Don't reconnect if it was a normal closure
		if (event.code !== 1000 && this.shouldReconnect) {
			this.handleReconnect()
		}
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
