<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js'
	import { Label } from '$lib/components/ui/label/index.js'
	import type { Snippet } from 'svelte'

	interface Props {
		value: boolean
		id: string
		label: string
		description?: Snippet
	}

	let { value = $bindable(), id, label, description }: Props = $props()
</script>

<div class="grid gap-2">
	<div class="items-stat flex gap-3">
		<Checkbox {id} bind:checked={value} />
		<div class="grid gap-2">
			<Label for={id}>{label}</Label>
			{#if description}
				<div class="text-muted-foreground text-sm">
					{@render description()}
				</div>
			{/if}
		</div>
	</div>
</div>
