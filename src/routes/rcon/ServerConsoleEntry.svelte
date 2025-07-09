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

	const splitted = message.text.split('\n')
</script>

<div>
	<div class="flex gap-4">
		<span class="text-blue-600">{formattedDate}</span>
		<div class="flex flex-col">
			{#each splitted as line, i (i)}
				<span>{line}</span>
			{/each}
		</div>
	</div>
	{#if message.response}
		{@const splittedResponse = message.response.text.split('\n')}
		<div class="flex flex-col text-gray-600">
			{#each splittedResponse as line, i (i)}
				<span>{line}</span>
			{/each}
		</div>
	{/if}
</div>
