import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RustRconConnection } from '../routes/rcon/rust-rcon'
import { LogType, type CommandResponse } from '../routes/rcon/rust-rcon.types'
import { FakeWebSocket } from './lib/fake-websocket'

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

	it('onMessage handles invalid JSON without crashing', async function (): Promise<void> {
		const conn = new RustRconConnection('ws://example')
		await conn.connect()

		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
			/* silence error */
		})

		const socket = FakeWebSocket.instances[0]

		// Simulate receiving a malformed JSON message
		socket.onmessage?.(new MessageEvent('message', { data: 'this is not json' }))

		// The wrapper should not crash and should have logged an error
		expect(errorSpy).toHaveBeenCalledWith('Failed to parse message:', expect.any(Error))

		// Check if the connection is still considered "alive" and can send
		const stillWorks = conn.sendCommand('test')
		expect(stillWorks).toBe(true)

		errorSpy.mockRestore()
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

	it('sendCommandGetResponsesMany() handles multiple responses and timeout', async function (): Promise<void> {
		vi.useFakeTimers()
		const conn = new RustRconConnection('ws://example')
		await conn.connect()
		const socket = FakeWebSocket.instances[0]

		const callback = vi.fn()
		conn.sendCommandGetResponsesMany('list', callback)

		expect(socket.sent.length).toBe(1)
		const sentRaw = socket.sent[0] as string
		const sent = JSON.parse(sentRaw) as { Message: string; Identifier: number }
		expect(sent.Message).toBe('list')

		const response1: CommandResponse = {
			Message: 'Player 1',
			Identifier: sent.Identifier,
			Type: LogType.Generic,
			Stacktrace: '',
		}
		socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify(response1) }))
		expect(callback).toHaveBeenCalledWith(response1)
		expect(callback).toHaveBeenCalledTimes(1)

		const response2: CommandResponse = {
			Message: 'Player 2',
			Identifier: sent.Identifier,
			Type: LogType.Generic,
			Stacktrace: '',
		}
		socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify(response2) }))
		expect(callback).toHaveBeenCalledWith(response2)
		expect(callback).toHaveBeenCalledTimes(2)

		// Now, let's test the timeout
		const priv = conn as unknown as { messagesMapMany: Map<number, unknown> }
		expect(priv.messagesMapMany.has(sent.Identifier)).toBe(true)

		await vi.advanceTimersByTimeAsync(5_000)

		expect(priv.messagesMapMany.has(sent.Identifier)).toBe(false)

		// After timeout, callback should not be called anymore
		const response3: CommandResponse = {
			Message: 'Player 3',
			Identifier: sent.Identifier,
			Type: LogType.Generic,
			Stacktrace: '',
		}
		socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify(response3) }))
		expect(callback).toHaveBeenCalledTimes(2) // still 2
	})

	it('sendCommandGetResponsesMany() respects custom timeout', async function (): Promise<void> {
		vi.useFakeTimers()
		const conn = new RustRconConnection('ws://example')
		await conn.connect()

		const callback = vi.fn()
		conn.sendCommandGetResponsesMany('list', callback, 10_000) // custom timeout

		const priv = conn as unknown as {
			messagesMapMany: Map<number, unknown>
		}
		const socket = FakeWebSocket.instances[0]
		const sentRaw = socket.sent[0] as string
		const sent = JSON.parse(sentRaw) as { Identifier: number }

		expect(priv.messagesMapMany.has(sent.Identifier)).toBe(true)

		await vi.advanceTimersByTimeAsync(5_000)
		expect(priv.messagesMapMany.has(sent.Identifier)).toBe(true) // should still be there

		await vi.advanceTimersByTimeAsync(5_000)
		expect(priv.messagesMapMany.has(sent.Identifier)).toBe(false) // should be gone now
	})
})
