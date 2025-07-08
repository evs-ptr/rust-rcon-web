const map = new Map<number, ServerConsoleStore>()

export class ServerConsoleStore {
	public readonly messages: string[] = $state([])
	public commandInput: string = $state('')
}

function createServerConsoleStore(id: number): ServerConsoleStore {
	const store = new ServerConsoleStore()
	map.set(id, store)
	return store
}

export function getServerConsoleStore(id: number): ServerConsoleStore {
	const store = map.get(id)
	if (store) {
		return store
	}
	return createServerConsoleStore(id)
}
