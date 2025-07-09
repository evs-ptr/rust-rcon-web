if (typeof globalThis.ErrorEvent === 'undefined') {
	class ErrorEvent extends Event {
		public readonly error: Error

		constructor(type: string, options: { error: Error }) {
			super(type)
			this.error = options.error
		}
	}
	;(globalThis as unknown as { ErrorEvent: typeof globalThis.ErrorEvent }).ErrorEvent =
		ErrorEvent as typeof globalThis.ErrorEvent
}

// Polyfill for MessageEvent for the Node.js test environment
if (typeof globalThis.MessageEvent === 'undefined') {
	class MessageEvent<T = unknown> extends Event {
		public readonly data: T

		constructor(type: string, options: { data: T }) {
			super(type)
			this.data = options.data
		}
	}
	;(globalThis as unknown as { MessageEvent: typeof globalThis.MessageEvent }).MessageEvent =
		MessageEvent as typeof globalThis.MessageEvent
}

/**
 * Very small in-memory stand-in that behaves like the browser WebSocket
 * just enough for RustRconConnection. It records every instance so tests
 * can inspect them.
 */
export class FakeWebSocket {
	public static readonly CONNECTING = 0
	public static readonly OPEN = 1
	public static readonly CLOSING = 2
	public static readonly CLOSED = 3

	public static instances: FakeWebSocket[] = []

	public readyState = FakeWebSocket.CONNECTING
	public url: string

	public onopen: ((event: Event) => void) | null = null
	public onmessage: ((event: MessageEvent) => void) | null = null
	public onerror: ((event: Event) => void) | null = null
	public onclose: ((event: CloseEvent) => void) | null = null

	public readonly sent: unknown[] = []

	public static shouldFailOnConnect = false

	constructor(url: string) {
		this.url = url
		FakeWebSocket.instances.push(this)

		if (FakeWebSocket.shouldFailOnConnect) {
			queueMicrotask(() => this.triggerError(new Error('Simulated connection failure')))
			return
		}

		// Simulate asynchronous connection establishment
		queueMicrotask(this.triggerOpen.bind(this))
	}

	private triggerOpen(): void {
		this.readyState = FakeWebSocket.OPEN
		this.onopen?.(new Event('open'))
	}

	private triggerError(error: Error): void {
		this.readyState = FakeWebSocket.CLOSED
		this.onerror?.(new ErrorEvent('error', { error }))
	}

	send(data: unknown): void {
		if (this.readyState !== FakeWebSocket.OPEN) {
			throw new Error('Cannot send on a socket that is not open')
		}
		this.sent.push(data)
	}

	close(code: number = 1000, reason: string = ''): void {
		this.readyState = FakeWebSocket.CLOSED
		this.onclose?.({ code, reason } as unknown as CloseEvent)
	}
}
