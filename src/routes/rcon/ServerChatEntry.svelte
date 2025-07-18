<script lang="ts">
	import { ChatChannelEnum, type ChatEntry } from './rust-rcon-chat'

	interface Props {
		entry: ChatEntry
	}

	const { entry }: Props = $props()

	function epochToDate(epoch: number): Date {
		return new Date(epoch * 1000)
	}

	function isSteamId(id: bigint) {
		return id > 76561197960265728n
	}

	function stringToSteamId(id: string): bigint {
		return BigInt(id)
	}

	function formatDate(date: Date): string {
		const formattedDate =
			`${date.getHours().toString().padStart(2, '0')}` +
			`:${date.getMinutes().toString().padStart(2, '0')}` +
			`:${date.getSeconds().toString().padStart(2, '0')}`
		return formattedDate
	}

	function getChannelColor(channel: ChatChannelEnum): string {
		switch (channel) {
			case ChatChannelEnum.Team:
				return 'oklch(0.8688 0.2159 128.33)' // #a9ed2d
			case ChatChannelEnum.Cards:
				return 'oklch(87.9% 0.169 91.605)' // not real
			case ChatChannelEnum.Global:
			case ChatChannelEnum.Server:
			case ChatChannelEnum.Local:
			case ChatChannelEnum.Clan:
			case ChatChannelEnum.ExternalDM:
			default:
				return ''
		}
	}

	function getUserNameColor(id: bigint): string {
		if (isSteamId(id)) {
			return 'oklch(0.7228 0.149269 250.6392)' // #55aaff
		} else {
			return ''
		}
	}

	const userId = stringToSteamId(entry.UserId)
	// const isPlayer = isSteamId(userId)

	const formattedDate = formatDate(epochToDate(entry.Time))
	const channelName = ChatChannelEnum[entry.Channel]
	const channelColor = getChannelColor(entry.Channel)
	const userNameColor = getUserNameColor(userId)
</script>

<div class="flex gap-1">
	<span class="mr-2 text-cyan-500 dark:text-cyan-400">{formattedDate}</span>
	<span style:color={channelColor}>[{channelName}]</span>
	<span style:color={userNameColor}>{entry.Username}:</span>
	<span class="text-pretty whitespace-pre-wrap">
		{entry.Message}
	</span>
</div>
