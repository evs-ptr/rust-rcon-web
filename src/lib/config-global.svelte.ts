import { getContext, setContext } from 'svelte'
import { StorageSynced } from './storage-synced'

const STORAGE_KEY = 'vc1_global_config'
const DEFAULT_CONTEXT_KEY = 'configGlobal'

type ConfigGlobalJson = {
	version: number
	consoleHistoryFetch: number
	consoleHistoryLimitEnable: boolean
	consoleHistoryLimit: number
	consoleChatInclude: boolean
	consoleChatHistoryFetch: number
	chatHistoryFetch: number
	chatHistoryLimitEnable: boolean
	chatHistoryLimit: number
}

export class ConfigGlobal extends StorageSynced {
	version: number = 1

	consoleHistoryFetch: number = $state(400)

	consoleHistoryLimitEnable: boolean = $state(true)
	consoleHistoryLimit: number = $state(10_000)

	consoleChatInclude: boolean = $state(true)
	consoleChatHistoryFetch: number = $state(90)

	chatHistoryFetch: number = $state(400)
	chatHistoryLimitEnable: boolean = $state(true)
	chatHistoryLimit: number = $state(1_000)

	constructor() {
		super(STORAGE_KEY)
	}

	fromJSON(json: object) {
		if ('version' in json && typeof json.version === 'number') {
			this.version = json.version
		}
		if ('consoleHistoryFetch' in json && typeof json.consoleHistoryFetch === 'number') {
			this.consoleHistoryFetch = json.consoleHistoryFetch
		}
		if ('consoleHistoryLimitEnable' in json && typeof json.consoleHistoryLimitEnable === 'boolean') {
			this.consoleHistoryLimitEnable = json.consoleHistoryLimitEnable
		}
		if ('consoleHistoryLimit' in json && typeof json.consoleHistoryLimit === 'number') {
			this.consoleHistoryLimit = json.consoleHistoryLimit
		}
		if ('consoleChatInclude' in json && typeof json.consoleChatInclude === 'boolean') {
			this.consoleChatInclude = json.consoleChatInclude
		}
		if ('consoleChatHistoryFetch' in json && typeof json.consoleChatHistoryFetch === 'number') {
			this.consoleChatHistoryFetch = json.consoleChatHistoryFetch
		}
		if ('chatHistoryFetch' in json && typeof json.chatHistoryFetch === 'number') {
			this.chatHistoryFetch = json.chatHistoryFetch
		}
		if ('chatHistoryLimitEnable' in json && typeof json.chatHistoryLimitEnable === 'boolean') {
			this.chatHistoryLimitEnable = json.chatHistoryLimitEnable
		}
		if ('chatHistoryLimit' in json && typeof json.chatHistoryLimit === 'number') {
			this.chatHistoryLimit = json.chatHistoryLimit
		}
	}

	toJSON(): ConfigGlobalJson {
		return {
			version: this.version,
			consoleHistoryFetch: this.consoleHistoryFetch,
			consoleHistoryLimitEnable: this.consoleHistoryLimitEnable,
			consoleHistoryLimit: this.consoleHistoryLimit,
			consoleChatInclude: this.consoleChatInclude,
			consoleChatHistoryFetch: this.consoleChatHistoryFetch,
			chatHistoryFetch: this.chatHistoryFetch,
			chatHistoryLimitEnable: this.chatHistoryLimitEnable,
			chatHistoryLimit: this.chatHistoryLimit,
		}
	}

	resetToDefault() {
		const def = new ConfigGlobal()
		const json = def.toJSON()
		this.fromJSON(json)
	}
}

export function setConfigGlobalContext() {
	const configGlobal = new ConfigGlobal()
	configGlobal.load()
	setContext<ConfigGlobal>(DEFAULT_CONTEXT_KEY, configGlobal)
	return configGlobal
}

export function getConfigGlobalContext(): ConfigGlobal {
	const context = getContext<ConfigGlobal | undefined>(DEFAULT_CONTEXT_KEY)
	if (!context) {
		throw new Error('ConfigGlobal was not set in context')
	}
	return context
}
