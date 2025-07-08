class ServerConsoleStore {
	public readonly messages: string[] = $state([])
	public commandInput: string = $state('')
}

export const serverConsoleStore = new ServerConsoleStore()
