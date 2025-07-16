import { ConfigServer, getAllSavedIdentifiers } from '$lib/config-server.svelte'
import { getContext, setContext } from 'svelte'
import { RustServer } from './rust-server.svelte'

export class ServersManager {
	public readonly servers: RustServer[] = $state([])
	public selectedServer: RustServer | null = $state(null)

	constructor() {
		this.loadSavedServers()
	}

	loadSavedServers() {
		const identifiers = getAllSavedIdentifiers()

		if (!identifiers || !identifiers.length) {
			const server = this.addBlankServer()
			this.selectedServer = server
			return
		}

		for (const id of identifiers) {
			try {
				const config = new ConfigServer(id)
				this.addServer(config)
			} catch (e) {
				console.error(`Error while creating server from storage ${id}`, e)
			}
		}

		if (this.servers.length) {
			this.selectedServer = this.servers[0]
		}
	}

	addServer(configServer: ConfigServer): RustServer {
		const newServer = new RustServer(configServer)
		this.servers.push(newServer)
		return newServer
	}

	addBlankServer(): RustServer {
		const newConfigServer = new ConfigServer(ServersManager.genUUID())
		return this.addServer(newConfigServer)
	}

	deleteServer(server: RustServer) {
		const index = this.servers.indexOf(server)
		if (index == -1) {
			return
		}

		server.cleanUp()
		server.configServer.destroy()
		server.configServer.delete()

		this.servers.splice(index, 1)

		if (this.selectedServer === server) {
			this.selectedServer = this.servers[index] || null
		}
	}

	private static genUUID(): string {
		try {
			return crypto.randomUUID()
		} catch {
			return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
				(+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
			)
		}
	}
}

// for SSR, we need to use context for it

const DEFAULT_KEY = 'serversManager'

export function setServersManagerContext() {
	const serversManager = new ServersManager()
	return setContext<ServersManager>(DEFAULT_KEY, serversManager)
}

export function getServersManagerContext(): ServersManager {
	const context = getContext<ServersManager | undefined>(DEFAULT_KEY)
	if (!context) {
		throw new Error('ServersManager was not set in context')
	}
	return context
}
