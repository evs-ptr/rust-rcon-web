import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommandResponse } from '../routes/rcon/rust-rcon'
import { LogType, RustRconConnection } from '../routes/rcon/rust-rcon'

// Polyfill for ErrorEvent for the Node.js test environment
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
class FakeWebSocket {
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

let realWebSocket: typeof WebSocket | undefined

beforeEach(function setUp(): void {
	const globalObj = globalThis as { WebSocket?: typeof WebSocket }
	realWebSocket = globalObj.WebSocket
	globalObj.WebSocket = FakeWebSocket as unknown as typeof WebSocket
	vi.useRealTimers()
})

afterEach(function tearDown(): void {
	if (realWebSocket) {
		;(globalThis as { WebSocket?: typeof WebSocket }).WebSocket = realWebSocket
	} else {
		delete (globalThis as { WebSocket?: typeof WebSocket }).WebSocket
	}
	FakeWebSocket.instances.length = 0
	FakeWebSocket.shouldFailOnConnect = false
	vi.useRealTimers()
})

describe('RustRconConnection', function (): void {
	it('sendCommandGetResponse() sends command and resolves with response', async function (): Promise<void> {
		const conn = new RustRconConnection('ws://example')
		await conn.connect()

		const socket = FakeWebSocket.instances[0]

		const responsePromise = conn.sendCommandGetResponse('status')

		expect(socket.sent.length).toBe(1)
		const sentRaw = socket.sent[0] as string
		const sent = JSON.parse(sentRaw) as { Message: string; Identifier: number }
		expect(sent.Message).toBe('status')

		const reply: CommandResponse = {
			Message: 'Server is running',
			Identifier: sent.Identifier,
			Type: LogType.Generic,
			Stacktrace: '',
		}
		socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify(reply) }))

		await expect(responsePromise).resolves.toEqual(reply)
	})

	it('sendCommand() sends command without expecting response', async function (): Promise<void> {
		const conn = new RustRconConnection('ws://example')
		await conn.connect()

		const socket = FakeWebSocket.instances[0]

		expect(conn.sendCommand('kickall')).toBe(true)
		expect(socket.sent.length).toBe(1)
		const sent = JSON.parse(socket.sent[0] as string) as { Message: string; Identifier: number }
		expect(sent).toStrictEqual({ Message: 'kickall', Identifier: -698 })
	})

	it('subscriptions receive appropriate messages', async function (): Promise<void> {
		const conn = new RustRconConnection('ws://example')
		await conn.connect()

		const socket = FakeWebSocket.instances[0]

		const onGeneral = vi.fn()
		const onCommand = vi.fn()

		conn.subscribeOnMessageGeneral('test', onGeneral)
		conn.subscribeOnMessageCommand('test', onCommand)

		const generalMsg: CommandResponse = {
			Message: 'Welcome',
			Identifier: 0,
			Type: LogType.Generic,
			Stacktrace: '',
		}
		socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify(generalMsg) }))
		expect(onGeneral).toHaveBeenCalledWith(generalMsg)
		expect(onCommand).not.toHaveBeenCalled()

		const commandMsg: CommandResponse = {
			Message: 'OK',
			Identifier: -698,
			Type: LogType.Generic,
			Stacktrace: '',
		}
		socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify(commandMsg) }))
		expect(onCommand).toHaveBeenCalledWith(commandMsg)
	})

	it('disconnect() clears maps and subscriptions', async function (): Promise<void> {
		const conn = new RustRconConnection('ws://example')
		await conn.connect()

		conn.subscribeOnMessageGeneral('g', () => {
			/* empty */
		})
		conn.subscribeOnMessageCommand('c', () => {
			/* empty */
		})

		// Access private fields for testing via casting to a structural type
		const testConn1 = conn as unknown as {
			subscriptionsOnMessageGeneral: Map<string, unknown>
			subscriptionsOnMessageCommand: Map<string, unknown>
		}
		expect(testConn1.subscriptionsOnMessageGeneral.size).toBe(1)
		expect(testConn1.subscriptionsOnMessageCommand.size).toBe(1)

		conn.disconnect()

		// After disconnect, maps should be cleared
		const testConn2 = conn as unknown as {
			subscriptionsOnMessageGeneral: Map<string, unknown>
			subscriptionsOnMessageCommand: Map<string, unknown>
		}
		expect(testConn2.subscriptionsOnMessageGeneral.size).toBe(0)
		expect(testConn2.subscriptionsOnMessageCommand.size).toBe(0)
	})

	it('identifier generation covers edge cases', function (): void {
		interface IdAccess {
			msgIdNext: number
			takeNextMsgId(): number
		}
		const conn = new RustRconConnection('ws://dummy') as unknown as IdAccess

		// Default sequence from MIN_INT_32
		conn.msgIdNext = -2_147_483_648
		const first = conn.takeNextMsgId()
		const second = conn.takeNextMsgId()
		expect(first).toBe(-2_147_483_648)
		expect(second).toBe(-2_147_483_647)

		// Skip reserved range around -698
		conn.msgIdNext = -699
		const reserved1 = conn.takeNextMsgId()
		const reserved2 = conn.takeNextMsgId()
		expect(reserved1).toBe(-699)
		expect(reserved2).toBe(1699)

		// Wrap-around at MAX_INT_32
		conn.msgIdNext = 2_147_483_646
		const nearMax = conn.takeNextMsgId()
		const wrapped = conn.takeNextMsgId()
		expect(nearMax).toBe(2_147_483_646)
		expect(wrapped).toBe(-2_147_483_648)
	})

	it('sendCommandGetResponse() rejects on timeout and cleans messagesMap', async function (): Promise<void> {
		vi.useFakeTimers()
		const conn = new RustRconConnection('ws://example')
		await conn.connect()

		const priv = conn as unknown as { messagesMap: Map<number, unknown> }

		const promise = conn.sendCommandGetResponse('who')
		expect(priv.messagesMap.size).toBe(1)

		// Attach rejection handler BEFORE advancing timers to avoid unhandled rejection notice
		const handled = expect(promise).rejects.toThrow('Timed out waiting for response')
		await vi.advanceTimersByTimeAsync(6_000)
		await handled
		expect(priv.messagesMap.size).toBe(0)
		vi.useRealTimers()
	})

	it('sendCommandGetResponse() rejects when send fails', async function (): Promise<void> {
		const conn = new RustRconConnection('ws://example')
		// Stub send to simulate failure
		vi.spyOn(conn, 'send').mockReturnValue(false)

		await expect(conn.sendCommandGetResponse('bad')).rejects.toThrow('Failed to send message')
	})

	it('unsubscribe helpers remove callbacks', async function (): Promise<void> {
		const conn = new RustRconConnection('ws://example')
		await conn.connect()
		const socket = FakeWebSocket.instances[0]

		const fnGen = vi.fn()
		const fnCmd = vi.fn()

		const unGen = conn.subscribeOnMessageGeneral('g1', fnGen)
		const unCmd = conn.subscribeOnMessageCommand('c1', fnCmd)

		unGen()
		unCmd()

		const msg: CommandResponse = { Message: 'hello', Identifier: 0, Type: LogType.Generic, Stacktrace: '' }
		socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify(msg) }))
		expect(fnGen).not.toHaveBeenCalled()
		expect(fnCmd).not.toHaveBeenCalled()
	})

	it('handles multiple concurrent commands with correct resolution and cleanup', async function (): Promise<void> {
		const conn = new RustRconConnection('ws://example')
		await conn.connect()
		const socket = FakeWebSocket.instances[0]

		const p1 = conn.sendCommandGetResponse('first')
		const p2 = conn.sendCommandGetResponse('second')
		const [raw1, raw2] = socket.sent as string[]
		const m1 = JSON.parse(raw1) as { Message: string; Identifier: number }
		const m2 = JSON.parse(raw2) as { Message: string; Identifier: number }

		// Reply out of order (second first)
		const r2: CommandResponse = {
			Message: 'two',
			Identifier: m2.Identifier,
			Type: LogType.Generic,
			Stacktrace: '',
		}
		socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify(r2) }))

		const r1: CommandResponse = {
			Message: 'one',
			Identifier: m1.Identifier,
			Type: LogType.Generic,
			Stacktrace: '',
		}
		socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify(r1) }))

		const [res1, res2] = await Promise.all([p1, p2])
		expect(res1).toEqual(r1)
		expect(res2).toEqual(r2)

		const priv = conn as unknown as { messagesMap: Map<number, unknown> }
		expect(priv.messagesMap.size).toBe(0)
	})
})
