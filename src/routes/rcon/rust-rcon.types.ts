export interface ServerInfo {
	Hostname: string
	MaxPlayers: number
	Players: number
	Queued: number
	Joining: number
	ReservedSlots: number
	EntityCount: number
	GameTime: string
	Uptime: number
	Map: string
	Framerate: number
	Memory: number
	MemoryUsageSystem: number
	Collections: number
	NetworkIn: number
	NetworkOut: number
	Restarting: boolean
	SaveCreatedTime: string
	Version: number
	Protocol: string
}

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
