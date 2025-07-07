import { RustServer } from './rust-server'

export function createServersManager() {
	const servers = $state<RustServer[]>([])

	function addServer() {
		const newServer = new RustServer()
		servers.push(newServer)
		return newServer
	}

	return { servers, addServer }
}
