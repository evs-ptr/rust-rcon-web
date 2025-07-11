import { getContext, setContext } from 'svelte'
import { RustServer } from './rust-server.svelte'

export class ServersManager {
	public readonly servers: RustServer[] = $state([])
	public selectedServer: RustServer | null = $state(null)

	constructor() {
		const server = this.addServer()
		server.ipPort = '127.0.0.1:24247'
		this.selectedServer = server
	}

	addServer() {
		const newServer = new RustServer()
		this.servers.push(newServer)
		return newServer
	}

	deleteServer(server: RustServer) {
		const index = this.servers.indexOf(server)
		if (index == -1) {
			return
		}

		server.cleanUp()
		this.servers.splice(index, 1)

		if (this.selectedServer === server) {
			this.selectedServer = this.servers[index] || null
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
