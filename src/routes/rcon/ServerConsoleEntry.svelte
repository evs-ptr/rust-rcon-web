<script lang="ts">
	import { type ChatEntry, ChatChannelEnum } from './rust-rcon-chat'
	import { LogType } from './rust-rcon.types'
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
					'border-destructive',
					'text-destructive',
					'bg-destructive/10',
					'rounded-r',
					'font-medium',
				]
			case LogType.Warning:
				return [
					'pl-2',
					'border-l-2',
					'border-yellow-600 dark:border-yellow-400',
					'text-yellow-600 dark:text-yellow-400',
					'bg-yellow-600/10 dark:bg-yellow-400/10',
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
		<span class="text-cyan-500 dark:text-cyan-400">{formattedDate}</span>
		{@render logText(message)}
	</div>
	{#if message.responses}
		<div class="text-muted-foreground flex flex-col">
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
