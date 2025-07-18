import type { ConfigGlobal } from '$lib/config-global.svelte'
import { CommandHistory } from './command-history.svelte'
import type { ChatEntry } from './rust-rcon-chat'

export class ServerChatMessage {
	private static idCounter = 0
	public readonly id: number

	public readonly message: ChatEntry

	constructor(message: ChatEntry) {
		this.id = ServerChatMessage.idCounter++
		this.message = message
	}
}

export class ServerChatStore {
	public readonly config: ConfigGlobal

	readonly chatMessages: ServerChatMessage[] = $state([])
	readonly chatCommandInput: string = $state('')

	public readonly history: CommandHistory = new CommandHistory()

	public lastScrollTop: number | null = null
	public lastShouldScroll: boolean | null = null
	public lastContainerHeight: string | null = null

	public isPopulatedChat: boolean = $state(false)

	private unsubscribeOnMessagesPlayerRelated: (() => void) | null = null

	constructor(config: ConfigGlobal) {
		this.config = config
	}

	destroy() {
		this.unsubscribeOnMessagesPlayerRelated?.()
		this.unsubscribeOnMessagesPlayerRelated = null
		this.chatMessages.length = 0
	}
}

const map = new Map<number, ServerChatStore>()

function createServerChatStore(id: number, config: ConfigGlobal): ServerChatStore {
	const store = new ServerChatStore(config)
	map.set(id, store)
	return store
}

export function removeServerChatStore(id: number): boolean {
	const store = map.get(id)
	if (store) {
		store.destroy()
	}
	return map.delete(id)
}

export function getServerChatStore(id: number, config: ConfigGlobal): ServerChatStore {
	const store = map.get(id)
	if (store) {
		return store
	}
	return createServerChatStore(id, config)
}
