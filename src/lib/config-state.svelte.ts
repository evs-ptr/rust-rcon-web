import { getContext, setContext } from 'svelte'
import { StorageSynced } from './storage-synced'

const STORAGE_KEY = 'vc1_global_state'
const DEFAULT_CONTEXT_KEY = 'configState'

type ConfigStateJson = {
	version: number
	iKnow: boolean
	serversOrderUUID: string[]
	selectedServerUUID: string
}

export class ConfigState extends StorageSynced {
	version: number = 1

	iKnow: boolean = $state(false)
	serversOrderUUID: string[] = $state([])
	selectedServerUUID: string = $state('')

	private effectCleanup: () => void

	constructor() {
		super(STORAGE_KEY)

		this.load()

		this.effectCleanup = $effect.root(() => {
			$effect(() => {
				// listen for changes

				/* eslint-disable @typescript-eslint/no-unused-expressions */
				this.iKnow
				this.serversOrderUUID
				this.selectedServerUUID
				/* eslint-enable @typescript-eslint/no-unused-expressions */

				this.save()
			})
		})
	}

	override destroy() {
		this.effectCleanup()
		super.destroy()
	}

	fromJSON(json: object) {
		if ('version' in json && typeof json.version === 'number' && this.version !== json.version) {
			this.version = json.version
		}
		if ('iKnow' in json && typeof json.iKnow === 'boolean' && this.iKnow !== json.iKnow) {
			this.iKnow = json.iKnow
		}
		if (
			'serversOrderUUID' in json &&
			typeof json.serversOrderUUID === 'object' &&
			Array.isArray(json.serversOrderUUID) &&
			this.serversOrderUUID.length != json.serversOrderUUID.length &&
			!this.serversOrderUUID.every((el, ind) => el === (json.serversOrderUUID as string[])[ind])
		) {
			this.serversOrderUUID = json.serversOrderUUID as string[]
		}
		if (
			'selectedServerUUID' in json &&
			typeof json.selectedServerUUID === 'string' &&
			this.selectedServerUUID !== json.selectedServerUUID
		) {
			// don't change between tabs
			if (!this.selectedServerUUID) {
				this.selectedServerUUID = json.selectedServerUUID
			}
		}
	}

	toJSON(): ConfigStateJson {
		return {
			version: this.version,
			iKnow: this.iKnow,
			serversOrderUUID: this.serversOrderUUID,
			selectedServerUUID: this.selectedServerUUID,
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
