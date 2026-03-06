import { describe, expect, it } from 'vitest'
import { LogType, type CommandResponse, type HistoryMessage } from '../routes/rcon/core/rust-rcon.types'

function createConfig() {
	return {
		consoleHistoryFetch: 800,
		consoleHistoryLimitEnable: true,
		consoleHistoryLimit: 4_000,
		consoleChatInclude: false,
		consoleChatHistoryFetch: 90,
	} as const
}

function createServerStub(responsePromise: Promise<CommandResponse | undefined>) {
	return {
		canProbeCommandReadiness() {
			return true
		},
		sendCommandGetResponse() {
			return responsePromise
		},
	} as const
}

describe('ServerConsoleStore', function () {
	it('preserves initial history when live messages arrive before populate finishes', async function () {
		;(globalThis as { $state?: <T>(value: T) => T }).$state = <T>(value: T) => value

		const { ServerConsoleStore } = await import('../routes/rcon/stores/server-console.svelte')

		let resolveResponse!: (value: CommandResponse | undefined) => void
		const responsePromise = new Promise<CommandResponse | undefined>((resolve) => {
			resolveResponse = resolve
		})

		const store = new ServerConsoleStore(createConfig() as never)
		const server = createServerStub(responsePromise)

		const populatePromise = store.tryPopulateConsole(server as never)

		store.onMessageGeneral({
			Message: 'live message',
			Identifier: 0,
			Type: LogType.Generic,
			Stacktrace: '',
		})

		const history: HistoryMessage[] = [
			{
				Message: 'history message',
				Stacktrace: '',
				Type: LogType.Generic,
				Time: 1,
			},
		]

		resolveResponse({
			Message: JSON.stringify(history),
			Identifier: 123,
			Type: LogType.Generic,
			Stacktrace: '',
		})

		await populatePromise
		await new Promise((resolve) => setTimeout(resolve, 20))

		expect(store.messages).toHaveLength(2)
		expect(store.messages[0]?.message).toBe('history message')
		expect(store.messages[1]?.message).toBe('live message')
		expect(store.isPopulatedConsole).toBe(true)
	})
})
