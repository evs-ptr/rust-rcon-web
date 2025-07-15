<script lang="ts" generics="T extends string | number">
	import { Input } from '$lib/components/ui/input/index.js'
	import { Label } from '$lib/components/ui/label/index.js'

	interface Props<T extends string | number> {
		value: T
		validator: (val: T) => boolean
		id: string
		label: string
	}

	let { value = $bindable(), validator, id, label }: Props<T> = $props()

	let middleVal: T = $derived(value)
	let isNumber: boolean = $derived(typeof value === 'number')
	let isInputValid: boolean = $derived(validator(middleVal))

	function getVal() {
		return middleVal
	}

	function setVal(val: T) {
		middleVal = val
		if (validator(val)) {
			value = middleVal
		}
	}
</script>

<div class="grid gap-3">
	<Label for={id}>{label}</Label>
	<Input {id} type={isNumber ? 'number' : 'text'} aria-invalid={!isInputValid} bind:value={getVal, setVal} />
</div>
