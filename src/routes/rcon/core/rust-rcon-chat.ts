import type { CommandResponse } from './rust-rcon.types'

export enum ChatChannelEnum {
	Global = 0,
	Team = 1,
	Server = 2,
	Cards = 3,
	Local = 4,
	Clan = 5,
	ExternalDM = 6,
}

export interface ChatEntry {
	Channel: ChatChannelEnum
	Message: string
	UserId: string
	Username: string
	Color: string
	Time: number
}

export function parseChatEntry(message: CommandResponse): ChatEntry | null {
	try {
		const chatEntry = JSON.parse(message.Message) as ChatEntry
		return chatEntry
	} catch (error) {
		console.error('Error while parsing chat entry', error)
		return null
	}
}

export function parseChatEntries(message: CommandResponse): ChatEntry[] | null {
	try {
		const chatEntries = JSON.parse(message.Message) as ChatEntry[]
		return chatEntries
	} catch (error) {
		console.error('Error while parsing chat entries', error)
		return null
	}
}
