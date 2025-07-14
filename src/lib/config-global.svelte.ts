import { getContext, setContext } from 'svelte'
import { StorageSyncedState } from './storage-synced-state.svelte'

const STORAGE_KEY = 'vc1_global_config'
const DEFAULT_CONTEXT_KEY = 'configGlobal'

type ConfigGlobalJson = {
	version: number
}

export class ConfigGlobal extends StorageSyncedState {
	version: number = 1

	constructor() {
		super(STORAGE_KEY)
		this.load()
	}

	fromJSON(json: object) {
		if ('version' in json && typeof json.version === 'number') {
			this.version = json.version
		}
	}

	toJSON(): ConfigGlobalJson {
		return {
			version: this.version,
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
