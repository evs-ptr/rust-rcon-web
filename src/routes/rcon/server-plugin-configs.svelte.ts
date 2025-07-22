import type { ConfigGlobal } from '$lib/config-global.svelte'
import { parseFilesInfo } from './rust-rcon-plugin-configs'
import { constructRpcCommand, RpcIds, type RConFileInfo } from './rust-rcon-rpc'
import type { RustServer } from './rust-server.svelte'

export class ServerPluginConfigsStore {
	public readonly config: ConfigGlobal

	infos: RConFileInfo[] = $state([])
	selectedFile: string = $state('')

	constructor(config: ConfigGlobal) {
		this.config = config
	}

	async tryPopulate(server: RustServer) {
		const resp = await server.sendCommandGetResponse(constructRpcCommand(RpcIds.GetConfigsInfo))
		if (!resp) {
			console.error('Failed to get configs infos')
			return
		}

		const infos = parseFilesInfo(resp)
		this.infos = infos ?? []
	}

	destroy() {}
}

const map = new Map<number, ServerPluginConfigsStore>()

function createServerPluginConfigsStore(id: number, config: ConfigGlobal): ServerPluginConfigsStore {
	const store = new ServerPluginConfigsStore(config)
	map.set(id, store)
	return store
}

export function removeServerPluginConfigsStore(id: number): boolean {
	const store = map.get(id)
	if (store) {
		store.destroy()
	}
	return map.delete(id)
}

export function getServerPluginConfigsStore(id: number, config: ConfigGlobal): ServerPluginConfigsStore {
	const store = map.get(id)
	if (store) {
		return store
	}
	return createServerPluginConfigsStore(id, config)
}
