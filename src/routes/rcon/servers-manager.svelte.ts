import { PUBLIC_SERV_IP_1, PUBLIC_SERV_PWD_1 } from '$env/static/public'
import { getContext, setContext } from 'svelte'
import { RustServer } from './rust-server.svelte'

export class ServersManager {
	public readonly servers: RustServer[] = $state([])
	public selectedServer: RustServer | null = $state(null)

	constructor() {
		const server = this.addServer()
		server.ipPort = '127.0.0.1:24247'
		server.password = '1jEIXkbSQty3'
		this.selectedServer = server

		if (PUBLIC_SERV_IP_1 && PUBLIC_SERV_PWD_1) {
			const server = this.addServer()
			server.ipPort = PUBLIC_SERV_IP_1
			server.password = PUBLIC_SERV_PWD_1
		}
	}

	addServer() {
		const newServer = new RustServer()
		this.servers.push(newServer)
		return newServer
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
