import {
	decompressBase64ToString,
	type RConError,
	type RConFileInfo,
	type RpcRepsonse,
} from './rust-rcon-rpc'
import type { CommandResponse } from './rust-rcon.types'

export function parseFilesInfo(message: CommandResponse): RConFileInfo[] | null {
	try {
		const filesInfo = JSON.parse(message.Message) as RpcRepsonse<RConFileInfo[]>
		return filesInfo.Value
	} catch (error) {
		console.error('Error while parsing files info', error)
		return null
	}
}

export function parseFileInfo(message: CommandResponse): RConFileInfo | null {
	try {
		const fileInfo = JSON.parse(message.Message) as RpcRepsonse<RConFileInfo>
		return fileInfo.Value
	} catch (error) {
		console.error('Error while parsing file info', error)
		return null
	}
}

export function parseError(message: CommandResponse): RConError | null {
	try {
		const error = JSON.parse(message.Message) as RpcRepsonse<RConError>
		return error.Value
	} catch (error) {
		console.error('Error while parsing error', error)
		return null
	}
}

export async function parseConfigContentGzip(message: CommandResponse): Promise<string | null> {
	try {
		const configContent = JSON.parse(message.Message) as RpcRepsonse<string>
		return await decompressBase64ToString(configContent.Value)
	} catch (error) {
		console.error('Error while parsing config content', error)
		return null
	}
}
