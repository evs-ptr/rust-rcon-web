import { getContext, setContext } from 'svelte'
import { StorageSyncedState } from './storage-synced-state.svelte'

const STORAGE_KEY = 'vc1_global_state'
const DEFAULT_CONTEXT_KEY = 'configState'

type ConfigStateJson = {
	iKnow: boolean
}

export class ConfigState extends StorageSyncedState {
	iKnow: boolean = $state(false)

	constructor() {
		super(STORAGE_KEY)
		this.load()
	}

	fromJSON(json: object) {
		if ('iKnow' in json && typeof json.iKnow === 'boolean') {
			this.iKnow = json.iKnow
		}
	}

	toJSON(): ConfigStateJson {
		return {
			iKnow: this.iKnow,
		}
	}
}

export function setConfigStateContext() {
	const configState = new ConfigState()
	setContext<ConfigState>(DEFAULT_CONTEXT_KEY, configState)
	return configState
}

export function getConfigStateContext(): ConfigState {
	const context = getContext<ConfigState | undefined>(DEFAULT_CONTEXT_KEY)
	if (!context) {
		throw new Error('ConfigState was not set in context')
	}
	return context
}
