export enum ReportType {
	General = 0,
	Bug = 1,
	Cheat = 2,
	Abuse = 3,
	Idea = 4,
	OffensiveContent = 5,
	BreakingServerRules = 6,
}
export interface FeedbackReport {
	PlayerId: string
	PlayerName: string
	Subject: string
	Message: string
	Type: ReportType
}

export interface PlayerReport {
	PlayerId: string
	PlayerName: string
	TargetId: string
	TargetName: string
	Subject: string
	Message: string
	Type: string
}

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

export interface HistoryMessage {
	Message: string
	Stacktrace: string
	Type: LogType
	Time: number
}

export interface CommandSend {
	Message: string
	Identifier: number
}

export interface CommandResponse {
	Message: string
	Identifier: number
	Type: LogType
	Stacktrace: string
}

export enum LogType {
	Generic = 'Generic',
	Error = 'Error',
	Warning = 'Warning',
	Chat = 'Chat',
	Report = 'Report',
	ClientPerf = 'ClientPerf',
	Subscription = 'Subscription',
}
