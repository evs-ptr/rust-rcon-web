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

	function getChannelColorClasses(channel: ChatChannelEnum): string {
		switch (channel) {
			case ChatChannelEnum.Team:
				return 'text-lime-600 dark:text-lime-400'
			case ChatChannelEnum.Cards:
				return 'text-yellow-600 dark:text-yellow-400'
			case ChatChannelEnum.Global:
				return 'text-slate-800 dark:text-slate-300'
			case ChatChannelEnum.Server:
				return 'text-orange-600 dark:text-orange-400'
			case ChatChannelEnum.Local:
				return 'text-gray-600 dark:text-gray-400'
			case ChatChannelEnum.Clan:
				return 'text-purple-600 dark:text-purple-400'
			case ChatChannelEnum.ExternalDM:
				return 'text-pink-600 dark:text-pink-400'
			default:
				return ''
		}
	}

	function getUserNameColorClasses(id: bigint): string {
		if (isSteamId(id)) {
			return 'text-sky-600 dark:text-sky-500'
		} else {
			return ''
		}
	}

	function getSteamProfileLink(id: bigint) {
		return `https://steamcommunity.com/profiles/${id}`
	}

	// svelte-ignore state_referenced_locally
	const userId = stringToSteamId(entry.UserId)
	const isPlayer = isSteamId(userId)
	// svelte-ignore state_referenced_locally
	const formattedDate = formatDate(epochToDate(entry.Time))
	// svelte-ignore state_referenced_locally
	const channelName = ChatChannelEnum[entry.Channel]
	// svelte-ignore state_referenced_locally
	const channelClasses = getChannelColorClasses(entry.Channel)
	const userNameClasses = getUserNameColorClasses(userId)
</script>

<div class="flex flex-wrap gap-1 md:flex-nowrap">
	<span class="mr-2 text-cyan-500 dark:text-cyan-400">{formattedDate}</span>
	<span class={channelClasses}>[{channelName}]</span>
	{#if isPlayer}
		<a class={userNameClasses} href={getSteamProfileLink(userId)} target="_blank">{entry.Username}:</a>
	{:else}
		<span class={userNameClasses}>{entry.Username}:</span>
	{/if}
	<span class="text-pretty whitespace-pre-wrap">
		{entry.Message}
	</span>
</div>
