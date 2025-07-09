<script lang="ts">
	import { LogType } from './rust-rcon'
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
</script>

<div>
	<div class="flex gap-4">
		<span class="text-blue-600">{formattedDate}</span>
		<span
			class="whitespace-pre"
			class:text-red-500={message.logType == LogType.Error}
			class:text-yellow-500={message.logType == LogType.Warning}
		>
			{prepareText(message.text)}
		</span>
	</div>
	{#if message.responses}
		<div class="flex flex-col text-gray-600">
			{#each message.responses as response, i (i)}
				{@render responseSnippet(response)}
			{/each}
		</div>
	{/if}
</div>

{#snippet responseSnippet(response: ServerConsoleMessage)}
	<span
		class="whitespace-pre"
		class:text-red-500={response.logType == LogType.Error}
		class:text-yellow-500={response.logType == LogType.Warning}
	>
		{prepareText(response.text)}
	</span>
{/snippet}
