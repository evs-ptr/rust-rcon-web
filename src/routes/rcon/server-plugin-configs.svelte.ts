import type { ConfigGlobal } from '$lib/config-global.svelte'
import { parseConfigContentGzip, parseFileInfo, parseFilesInfo } from './rust-rcon-plugin-configs'
import { compressStringToBase64, constructRpcCommand, RpcIds, type RConFileInfo } from './rust-rcon-rpc'
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

	async getConfigInfo(server: RustServer, fileName: string): Promise<RConFileInfo | null> {
		const resp = await server.sendCommandGetResponse(constructRpcCommand(RpcIds.GetConfigInfo, [fileName]))
		if (!resp) {
			console.error('Failed to get config info')
			return null
		}

		const info = parseFileInfo(resp)
		return info
	}

	async getConfigContent(server: RustServer, fileName: string): Promise<string | null> {
		const resp = await server.sendCommandGetResponse(
			constructRpcCommand(RpcIds.GetConfigContent, [fileName, '--gzip'])
		)
		if (!resp) {
			console.error('Failed to get config content')
			return null
		}
		const content = await parseConfigContentGzip(resp)
		if (content == null) {
			console.error('Failed to parse config')
			return null
		}
		return content
	}

	async writeConfig(server: RustServer, content: string) {
		if (!this.selectedFile) {
			return
		}

		const payload = await compressStringToBase64(content)

		const resp = await server.sendCommandGetResponse(
			constructRpcCommand(RpcIds.SetConfigContent, [this.selectedFile, payload, '--gzip'])
		)

		console.log(resp)
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
