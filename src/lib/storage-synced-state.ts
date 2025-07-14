import { browser } from '$app/environment'
import { deleteFromStorage, getFromStorage, saveToStorage } from './storage'

const DEBOUNCE_SAVE_TIMEOUT = 300

export abstract class StorageSyncedState {
	private saveTimeout: ReturnType<typeof setTimeout> | null = null
	private storageKey: string

	constructor(storageKey: string) {
		this.storageKey = storageKey
		if (browser) {
			window.addEventListener('storage', this.onStorageChange)
			window.addEventListener('pagehide', this.forceSave)
		}
	}

	destroy() {
		if (browser) {
			window.removeEventListener('storage', this.onStorageChange)
			window.removeEventListener('pagehide', this.forceSave)
		}

		if (this.saveTimeout) {
			this.forceSave()
		}
	}

	private onStorageChange = (event: StorageEvent) => {
		if (event.key === this.storageKey) {
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
		saveToStorage(this.storageKey, this.toJSON())
	}

	load() {
		const obj = getFromStorage<object>(this.storageKey)
		if (obj) {
			this.fromJSON(obj)
		}
	}

	delete() {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout)
			this.saveTimeout = null
		}
		deleteFromStorage(this.storageKey)
	}

	abstract toJSON(): object
	abstract fromJSON(json: object): void
}
