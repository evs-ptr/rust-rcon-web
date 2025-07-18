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
