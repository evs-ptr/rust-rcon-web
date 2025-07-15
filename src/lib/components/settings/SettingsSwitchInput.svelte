<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js'
	import { Label } from '$lib/components/ui/label/index.js'

	interface Props {
		value: boolean
		id: string
		label: string
	}

	let { value = $bindable(), id, label }: Props = $props()
</script>

<div class="flex items-center gap-3">
	<Checkbox {id} bind:checked={value} />
	<Label for={id}>{label}</Label>
</div>
