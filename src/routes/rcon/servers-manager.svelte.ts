import { RustServer } from './rust-server.svelte'

export function createServersManager() {
	const servers: RustServer[] = $state([])

	function addServer() {
		const newServer = new RustServer()
		servers.push(newServer)
		return newServer
	}

	return { servers, addServer }
}
