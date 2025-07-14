import { getContext, setContext } from 'svelte'
import { deleteFromStorage, getFromStorage, saveToStorage } from './storage'

const STORAGE_KEY = 'vc1_global_state'
const DEFAULT_CONTEXT_KEY = 'configState'

export class ConfigState {
	iKnow: boolean = $state(false)

	constructor() {}

	save() {
		saveToStorage(STORAGE_KEY, this)
	}

	load() {
		const obj = getFromStorage<ReturnType<typeof this.toJSON>>(STORAGE_KEY)
		if (obj) {
			this.iKnow = obj.iKnow
		}
	}

	delete() {
		deleteFromStorage(STORAGE_KEY)
	}

	toJSON() {
		return {
			iKnow: this.iKnow,
		}
	}
}

export function setConfigStateContext() {
	const configState = new ConfigState()
	configState.load()
	return setContext<ConfigState>(DEFAULT_CONTEXT_KEY, configState)
}

export function getConfigStateContext(): ConfigState {
	const context = getContext<ConfigState | undefined>(DEFAULT_CONTEXT_KEY)
	if (!context) {
		throw new Error('ConfigState was not set in context')
	}
	return context
}
