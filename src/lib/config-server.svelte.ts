import { getAllKeys } from './storage'
import { StorageSynced } from './storage-synced'

const STORAGE_KEY_PREFIX = 'vc1_server_'

type ConfigServerJson = {
	version: number
	address: string
	password: string
	savePassword: boolean
	useSecureWebsocket: boolean
}

export class ConfigServer extends StorageSynced {
	identifier: string
	version: number = 1

	address: string = $state('')
	password: string = $state('') // not saved unless user specified
	savePassword: boolean = $state(false)
	useSecureWebsocket: boolean = $state(false)

	private effectCleanup: () => void

	constructor(identifier: string) {
		const key = STORAGE_KEY_PREFIX + identifier
		super(key)
		this.identifier = identifier

		this.load()

		this.effectCleanup = $effect.root(() => {
			$effect(() => {
				// listen for changes

				/* eslint-disable @typescript-eslint/no-unused-expressions */
				this.address
				this.password
				this.savePassword
				this.useSecureWebsocket
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
		if ('version' in json && typeof json.version === 'number') {
			this.version = json.version
		}
		if ('address' in json && typeof json.address === 'string') {
			this.address = json.address
		}
		if ('password' in json && typeof json.password === 'string') {
			this.password = json.password
		}
		if ('savePassword' in json && typeof json.savePassword === 'boolean') {
			this.savePassword = json.savePassword
		}
		if ('useSecureWebsocket' in json && typeof json.useSecureWebsocket === 'boolean') {
			this.useSecureWebsocket = json.useSecureWebsocket
		}
	}

	toJSON(): ConfigServerJson {
		return {
			version: this.version,
			address: this.address,
			password: this.savePassword ? this.password : '',
			savePassword: this.savePassword,
			useSecureWebsocket: this.useSecureWebsocket,
		}
	}

	resetToDefault(preserveCredentials: boolean) {
		const addr = this.address
		const pwd = this.password

		const def = new ConfigServer(this.identifier)
		const json = def.toJSON()
		this.fromJSON(json)
		def.destroy()

		if (preserveCredentials) {
			this.address = addr
			this.password = pwd
		}
	}
}

export function getAllSavedIdentifiers(): string[] {
	const keys = getAllKeys()?.filter((x) => x.startsWith(STORAGE_KEY_PREFIX))
	if (!keys) {
		return []
	}

	return keys.map((x) => x.slice(STORAGE_KEY_PREFIX.length)).filter(Boolean)
}
