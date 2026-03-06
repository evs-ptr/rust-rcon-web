import { describe, expect, it, vi } from 'vitest'
import { LogType, type CommandResponse } from '../routes/rcon/core/rust-rcon.types'

function createConfig() {
	return {
		chatHistoryFetch: 400,
		chatHistoryLimitEnable: true,
		chatHistoryLimit: 1_000,
	} as const
}

function createChatHistoryResponse(message: string): CommandResponse {
	return {
		Message: JSON.stringify([
			{
				Channel: 0,
				Message: message,
				UserId: '1',
				Username: 'tester',
				Color: '#fff',
				Time: 1,
			},
		]),
		Identifier: 123,
		Type: LogType.Chat,
		Stacktrace: '',
	}
}

describe('ServerChatStore', function () {
	it('retries chat history population when startup command responses time out', async function () {
		vi.useFakeTimers()
		;(globalThis as { $state?: <T>(value: T) => T }).$state = <T>(value: T) => value

		const { ServerChatStore } = await import('../routes/rcon/stores/server-chat.svelte')

		let attempts = 0
		const server = {
			canProbeCommandReadiness() {
				return true
			},
			sendCommandGetResponse() {
				attempts += 1
				if (attempts === 1) {
					return Promise.reject(new Error('Timed out waiting for response'))
				}

				return Promise.resolve(createChatHistoryResponse('history after retry'))
			},
		}

		const store = new ServerChatStore(createConfig() as never)

		await store.tryPopulateChat(server as never)
		expect(store.isPopulatedChat).toBe(false)
		expect(store.populateChatError).toBe(null)

		await vi.advanceTimersByTimeAsync(3_000)

		expect(store.isPopulatedChat).toBe(true)
		expect(store.chatMessages).toHaveLength(1)
		expect(store.chatMessages[0]?.message.Message).toBe('history after retry')

		vi.useRealTimers()
	})
})
