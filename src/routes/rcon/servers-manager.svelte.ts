import { ConfigServer, getAllSavedIdentifiers } from '$lib/config-server.svelte'
import type { ConfigState } from '$lib/config-state.svelte'
import { getContext, setContext } from 'svelte'
import { RustServer } from './rust-server.svelte'

export class ServersManager {
	readonly configState: ConfigState
	readonly servers: RustServer[] = $state([])
	selectedServer: RustServer | null = $derived.by(() => {
		const selectedUUID = this.configState.selectedServerUUID
		if (!selectedUUID) {
			return null
		}

		if (!this.servers || !this.servers.length) {
			return null
		}

		const server = this.servers.find((x) => x.configServer.identifier === selectedUUID)
		if (!server) {
			return null
		}

		return server
	})

	constructor(configState: ConfigState) {
		this.configState = configState
		this.loadSavedServers()
	}

	loadSavedServers() {
		const identifiers = getAllSavedIdentifiers()

		if (!identifiers || !identifiers.length) {
			const server = this.addBlankServer()
			this.selectServer(server)
			return
		}

		const identifierSet = new Set(identifiers)
		const currentOrder = this.configState.serversOrderUUID

		const validOrdered = currentOrder.filter((id) => identifierSet.has(id))
		const validOrderedSet = new Set(validOrdered)

		const newIdentifiers = identifiers.filter((id) => !validOrderedSet.has(id))

		const finalOrder = [...validOrdered, ...newIdentifiers]

		this.configState.serversOrderUUID = finalOrder

		// Load servers using the synchronized and correct order.
		for (const id of finalOrder) {
			try {
				const config = new ConfigServer(id)
				this.addServer(config)
			} catch (e) {
				console.error(`Error while creating server from storage ${id}`, e)
			}
		}
	}

	selectServer(server: RustServer | null) {
		this.configState.selectedServerUUID = server?.configServer.identifier ?? ''
	}

	addServer(configServer: ConfigServer): RustServer {
		const newServer = new RustServer(configServer)
		this.servers.push(newServer)
		if (!this.configState.serversOrderUUID.includes(newServer.configServer.identifier)) {
			this.configState.serversOrderUUID.push(newServer.configServer.identifier)
		}
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

		if (this.selectedServer === server) {
			this.selectServer(this.servers[index + 1] ?? null)
		}

		server.cleanUp()
		server.configServer.destroy()
		server.configServer.delete()

		this.servers.splice(index, 1)

		const orderIndex = this.configState.serversOrderUUID.indexOf(server.configServer.identifier)
		if (orderIndex != -1) {
			this.configState.serversOrderUUID.splice(orderIndex, 1)
		}
	}

	destroy() {
		for (const server of this.servers) {
			server.cleanUp()
			server.configServer.destroy()
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

export function setServersManagerContext(configState: ConfigState) {
	const serversManager = new ServersManager(configState)
	return setContext<ServersManager>(DEFAULT_KEY, serversManager)
}

export function getServersManagerContext(): ServersManager {
	const context = getContext<ServersManager | undefined>(DEFAULT_KEY)
	if (!context) {
		throw new Error('ServersManager was not set in context')
	}
	return context
}
