<script lang="ts">
	import { ChatChannelEnum, LogType, type ChatEntry } from './rust-rcon.types'
	import type { ServerConsoleMessage } from './server-console.svelte'

	interface Props {
		message: ServerConsoleMessage
	}

	const { message }: Props = $props()

	const formattedDate =
		`${message.timestamp.getHours().toString().padStart(2, '0')}` +
		`:${message.timestamp.getMinutes().toString().padStart(2, '0')}` +
		`:${message.timestamp.getSeconds().toString().padStart(2, '0')}`

	function prepareText(text: string): string {
		return text.trim()
	}

	// TODO: you know what to do
	function prepareChatText(chatEntry: ChatEntry): string {
		return `[${ChatChannelEnum[chatEntry.Channel]}] ${chatEntry.Username}: ${chatEntry.Message.trim()}`
	}

	function getLogTypeClasses(logType: LogType): string[] {
		switch (logType) {
			case LogType.Error:
				return [
					'pl-2',
					'border-l-2',
					'border-red-500',
					'text-red-500',
					'bg-red-500/5',
					'rounded-r',
					'font-medium',
				]
			case LogType.Warning:
				return [
					'pl-2',
					'border-l-2',
					'border-yellow-500',
					'text-yellow-500',
					'bg-yellow-500/5',
					'rounded-r',
					'font-medium',
				]
			default:
				return ['pl-2', 'border-l-1', 'border-transparent']
		}
	}
</script>

<div>
	<div class="flex gap-2">
		<span class="text-blue-600">{formattedDate}</span>
		{@render logText(message)}
	</div>
	{#if message.responses}
		<div class="flex flex-col text-gray-600">
			{#each message.responses as response, i (i)}
				{@render logText(response)}
			{/each}
		</div>
	{/if}
</div>

{#snippet logText(message: ServerConsoleMessage)}
	<span class={['whitespace-pre', ...getLogTypeClasses(message.logType)]}>
		{@render txt(message.message)}
	</span>
{/snippet}

{#snippet txt(message: string | ChatEntry)}
	{#if typeof message === 'string'}
		{prepareText(message)}
	{:else}
		{prepareChatText(message)}
	{/if}
{/snippet}
