export interface RpcRepsonse<T> {
	RpcId: number
	Value: T
}

export enum RpcIds {
	GetConfigsInfo = 2204695881,
	GetConfigInfo = 1894636674,
	GetConfigContent = 2553096967,
	SetConfigContent = 3819345815,
	SearchEntities = 1120335884,
	EntityDetails = 2650739934,
	EntitySave = 4230705942,
	EntityKill = 223927051,
	SendPlayerInventory = 1739174796,
	MoveInventoryItem = 3553623853,
	GetPermissionsMetadata = 1317317511,
	GetGroupPermissions = 631493895,
	TogglePermission = 3261363143,
}

export function constructRpcCommand(id: RpcIds, args?: string[]): string {
	let base = `c.webrcon.rpc ${id}`
	if (args && args.length > 0) {
		base += ' "' + args.join('" "') + '"'
	}
	return base
}

export interface RConFileInfo {
	Name: string
	ModEpoch: number
	Size: number
}

export interface RConError {
	Code: RConErrorEnum
	Error: string
}

export enum RConErrorEnum {
	InvalidArgs = 1,
	NoSuchFile = 2,
}

export async function compressStringToBase64(str: string): Promise<string> {
	if (!str) {
		return ''
	}

	const stream = new Blob([new TextEncoder().encode(str)]).stream()
	const compressedStream = stream.pipeThrough(new CompressionStream('gzip'))
	const compressedBuffer = await new Response(compressedStream).arrayBuffer()

	const bytes = new Uint8Array(compressedBuffer)
	return btoa(String.fromCharCode(...bytes))
}

export async function decompressBase64ToString(base64: string): Promise<string> {
	if (!base64) {
		return ''
	}

	const binary = atob(base64)
	const bytes = Uint8Array.from(binary, (m) => m.codePointAt(0) ?? 0)

	const stream = new Blob([bytes]).stream()
	const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'))
	const decompressedBuffer = await new Response(decompressedStream).arrayBuffer()

	return new TextDecoder().decode(decompressedBuffer)
}
