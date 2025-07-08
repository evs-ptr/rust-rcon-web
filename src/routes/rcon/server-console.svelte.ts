class ServerConsoleStore {
	public readonly messages: string[] = $state([])
}

export const serverConsoleStore = new ServerConsoleStore()
