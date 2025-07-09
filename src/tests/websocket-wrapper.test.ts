import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WebSocketWrapper } from '../routes/rcon/websocket-wrapper'
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

describe('WebSocketWrapper', function (): void {
	it('connect() resolves and sets isConnected', async function (): Promise<void> {
		const wrapper = new WebSocketWrapper('ws://example')
		await expect(wrapper.connect()).resolves.toBeUndefined()
		expect(wrapper.isConnected).toBe(true)
	})

	it('connect() times out if connection takes too long', async function (): Promise<void> {
		vi.useFakeTimers()

		const wrapper = new WebSocketWrapper('ws://example')
		const connectPromise = wrapper.connect()

		// Don't run microtasks, just advance time past the timeout
		vi.advanceTimersByTime(5_000)

		await expect(connectPromise).rejects.toThrow('Timed out connecting to websocket')
		expect(wrapper.isConnected).toBe(false)

		vi.useRealTimers()
	})

	it('connect() does nothing if already connected', async function (): Promise<void> {
		const wrapper = new WebSocketWrapper('ws://example')
		await wrapper.connect()
		expect(wrapper.isConnected).toBe(true)

		await wrapper.connect() // second call
		expect(FakeWebSocket.instances.length).toBe(1)
	})

	it('connect() returns the same promise if called while connecting', function (): void {
		const wrapper = new WebSocketWrapper('ws://example')
		const promise1 = wrapper.connect()
		const promise2 = wrapper.connect()
		expect(promise1).toBe(promise2)
	})

	it('connect() rejects on socket error', async function (): Promise<void> {
		const wrapper = new WebSocketWrapper('ws://example')
		const connectPromise = wrapper.connect()

		const socket = FakeWebSocket.instances[0]
		const testError = new Error('Connection failed')

		socket.onerror?.(new ErrorEvent('error', { error: testError }))

		await expect(connectPromise).rejects.toBe(testError)
		expect(wrapper.isConnected).toBe(false)
	})

	it('send() forwards data to the underlying socket', async function (): Promise<void> {
		const wrapper = new WebSocketWrapper('ws://example')
		await wrapper.connect()

		const socket = FakeWebSocket.instances[0]
		wrapper.send('ping')

		expect(socket.sent).toStrictEqual(['ping'])
	})

	it('send() returns false and does not throw if disconnected', function (): void {
		const wrapper = new WebSocketWrapper('ws://example')
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(function (): void {
			// silence warn
		})

		expect(wrapper.send('test')).toBe(false)
		expect(warnSpy).toHaveBeenCalledWith('Attempted to send message while disconnected')
		warnSpy.mockRestore()
	})

	it('send() returns false on send error', async function (): Promise<void> {
		const wrapper = new WebSocketWrapper('ws://example')
		await wrapper.connect()

		const errorSpy = vi.spyOn(console, 'error').mockImplementation(function (): void {
			// silence error
		})
		const socket = FakeWebSocket.instances[0]
		vi.spyOn(socket, 'send').mockImplementation(function () {
			throw new Error('Send failed')
		})

		expect(wrapper.send('test')).toBe(false)
		expect(errorSpy).toHaveBeenCalledWith('Failed to send message:', expect.any(Error))

		errorSpy.mockRestore()
	})

	it('disconnect() closes the connection and prevents reconnection', async function (): Promise<void> {
		vi.useFakeTimers()

		const wrapper = new WebSocketWrapper('ws://example')
		await wrapper.connect()

		const socket = FakeWebSocket.instances[0]
		wrapper.disconnect()

		expect(wrapper.isConnected).toBe(false)
		expect(socket.readyState).toBe(FakeWebSocket.CLOSED)

		socket.close(1011, 'abnormal close after our disconnect')

		await vi.advanceTimersByTimeAsync(2_000)

		expect(FakeWebSocket.instances.length).toBe(1) // No new socket instance

		vi.useRealTimers()
	})

	it('reconnects automatically after an abnormal close', async function (): Promise<void> {
		vi.useFakeTimers()

		const wrapper = new WebSocketWrapper('ws://example')
		await wrapper.connect()

		const firstSocket = FakeWebSocket.instances[0]
		// Trigger onclose with non-1000 code so wrapper attempts reconnection
		firstSocket.close(1011, 'server crash')

		// initial back-off delay in wrapper is 1000 ms
		vi.advanceTimersByTime(1_000)
		// Allow queued microtasks (new socket open) to run
		await vi.runOnlyPendingTimersAsync()

		expect(wrapper.isConnected).toBe(true)
		// There should now be two FakeWebSocket instances
		expect(FakeWebSocket.instances.length).toBe(2)

		vi.useRealTimers()
	})

	it('does not reconnect after a normal close', async function (): Promise<void> {
		vi.useFakeTimers()

		const wrapper = new WebSocketWrapper('ws://example')
		await wrapper.connect()

		const firstSocket = FakeWebSocket.instances[0]
		firstSocket.close(1000, 'normal closure')

		await vi.advanceTimersByTimeAsync(2_000)

		expect(wrapper.isConnected).toBe(false)
		expect(FakeWebSocket.instances.length).toBe(1)

		vi.useRealTimers()
	})

	it('stops reconnecting after max attempts', async function (): Promise<void> {
		vi.useFakeTimers()

		const wrapper = new WebSocketWrapper('ws://example')
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(wrapper as any).maxReconnectAttempts = 2

		const errorSpy = vi.spyOn(console, 'error').mockImplementation(function (): void {
			// silence errors
		})

		await wrapper.connect()
		expect(wrapper.isConnected).toBe(true)

		FakeWebSocket.shouldFailOnConnect = true

		const firstSocket = FakeWebSocket.instances[0]
		firstSocket.close(1011, 'server crash')

		await vi.advanceTimersByTimeAsync(1_000) // 1st reconnect attempt
		await vi.advanceTimersByTimeAsync(1_300) // 2nd reconnect attempt

		expect(errorSpy).toHaveBeenCalledWith('Reconnection failed:', expect.any(Error))
		expect(errorSpy).toHaveBeenCalledWith('Max reconnection attempts reached or reconnection disabled')

		// Make sure it doesn't try again
		await vi.advanceTimersByTimeAsync(5_000)

		expect(FakeWebSocket.instances.length).toBe(3) // Initial + 2 attempts

		errorSpy.mockRestore()
		vi.useRealTimers()
	})
})
