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

	constructor(identifier: string) {
		const key = STORAGE_KEY_PREFIX + identifier
		super(key)
		this.identifier = identifier
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

		if (preserveCredentials) {
			this.address = addr
			this.password = pwd
		}
	}
}
