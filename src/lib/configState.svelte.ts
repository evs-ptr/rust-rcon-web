import { browser } from '$app/environment'
import { getContext, setContext } from 'svelte'
import { deleteFromStorage, getFromStorage, saveToStorage } from './storage'

const STORAGE_KEY = 'vc1_global_state'
const DEFAULT_CONTEXT_KEY = 'configState'
const DEBOUNCE_SAVE_TIMEOUT = 200

export class ConfigState {
	iKnow: boolean = $state(false)

	private saveTimeout: ReturnType<typeof setTimeout> | null = $state(null)

	constructor() {
		if (browser) {
			window.addEventListener('storage', this.onStorageChange)
			window.addEventListener('pagehide', this.forceSave)
		}
	}

	load() {
		const obj = getFromStorage<ReturnType<typeof this.toJSON>>(STORAGE_KEY)
		if (obj) {
			this.iKnow = obj.iKnow
		}
	}

	delete() {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout)
			this.saveTimeout = null
		}
		deleteFromStorage(STORAGE_KEY)
	}

	destroy() {
		if (browser) {
			window.removeEventListener('storage', this.onStorageChange)
			window.removeEventListener('pagehide', this.forceSave)
		}
		this.forceSave()
	}

	save() {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout)
		}

		this.saveTimeout = window.setTimeout(() => {
			this.saveTimeout = null
			this._save()
		}, DEBOUNCE_SAVE_TIMEOUT)
	}

	private _save() {
		saveToStorage(STORAGE_KEY, this)
	}

	private onStorageChange = (event: StorageEvent) => {
		if (event.key === STORAGE_KEY) {
			this.load()
		}
	}

	private forceSave = () => {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout)
			this.saveTimeout = null
		}
		this._save()
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
