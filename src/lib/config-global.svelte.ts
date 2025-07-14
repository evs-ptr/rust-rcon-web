import { getContext, setContext } from 'svelte'
import { StorageSynced } from './storage-synced'

const STORAGE_KEY = 'vc1_global_config'
const DEFAULT_CONTEXT_KEY = 'configGlobal'

type ConfigGlobalJson = {
	version: number
	consoleHistoryFetch: number
	consoleHistoryClampEnable: boolean
	consoleHistoryClamp: number
	consoleChatInclude: boolean
	consoleChatHistoryFetch: number
}

export class ConfigGlobal extends StorageSynced {
	version: number = 1

	consoleHistoryFetch: number = 400

	consoleHistoryClampEnable: boolean = true
	consoleHistoryClamp: number = 10_000

	consoleChatInclude: boolean = true
	consoleChatHistoryFetch: number = 90

	constructor() {
		super(STORAGE_KEY)
		this.load()
	}

	fromJSON(json: object) {
		if ('version' in json && typeof json.version === 'number') {
			this.version = json.version
		}
		if ('consoleHistoryFetch' in json && typeof json.consoleHistoryFetch === 'number') {
			this.consoleHistoryFetch = json.consoleHistoryFetch
		}
		if ('consoleHistoryClampEnable' in json && typeof json.consoleHistoryClampEnable === 'boolean') {
			this.consoleHistoryClampEnable = json.consoleHistoryClampEnable
		}
		if ('consoleHistoryClamp' in json && typeof json.consoleHistoryClamp === 'number') {
			this.consoleHistoryClamp = json.consoleHistoryClamp
		}
		if ('consoleChatInclude' in json && typeof json.consoleChatInclude === 'boolean') {
			this.consoleChatInclude = json.consoleChatInclude
		}
		if ('consoleChatHistoryFetch' in json && typeof json.consoleChatHistoryFetch === 'number') {
			this.consoleChatHistoryFetch = json.consoleChatHistoryFetch
		}
	}

	toJSON(): ConfigGlobalJson {
		return {
			version: this.version,
			consoleHistoryFetch: this.consoleHistoryFetch,
			consoleHistoryClampEnable: this.consoleHistoryClampEnable,
			consoleHistoryClamp: this.consoleHistoryClamp,
			consoleChatInclude: this.consoleChatInclude,
			consoleChatHistoryFetch: this.consoleChatHistoryFetch,
		}
	}
}

export function setConfigGlobalContext() {
	const configGlobal = new ConfigGlobal()
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
