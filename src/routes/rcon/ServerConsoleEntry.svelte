<script lang="ts">
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
		<div class="flex flex-col">
			<span class="whitespace-pre">{prepareText(message.text)}</span>
		</div>
	</div>
	{#if message.response}
		<div class="flex flex-col text-gray-600">
			<span class="whitespace-pre">{prepareText(message.response.text)}</span>
		</div>
	{/if}
</div>
