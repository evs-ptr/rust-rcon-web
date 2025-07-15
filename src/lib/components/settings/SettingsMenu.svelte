<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
	import { Input } from '$lib/components/ui/input/index.js'
	import { Label } from '$lib/components/ui/label/index.js'
	import * as Sheet from '$lib/components/ui/sheet/index.js'
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import SettingsIcon from '@lucide/svelte/icons/settings'

	const config = getConfigGlobalContext()

	function saveConfig() {
		config.save()
	}
</script>

<Sheet.Root>
	<Sheet.Trigger class={buttonVariants({ variant: 'outline' })}>
		<SettingsIcon />
	</Sheet.Trigger>
	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>Global Settings</Sheet.Title>
		</Sheet.Header>
		<div class="grid flex-1 auto-rows-min gap-6 overflow-scroll px-4">
			<div class="grid gap-3">
				<Label for="name" class="text-right">Name</Label>
				<Input id="name" value="Pedro Duarte" />
			</div>
		</div>
		<Sheet.Footer class="flex flex-col gap-4 sm:flex-row sm:gap-2">
			<Button variant="outline">Reset</Button>
			<Sheet.Close class={[buttonVariants({ variant: 'default' }), 'grow']} onclick={saveConfig}
				>Save Settings to Storage</Sheet.Close
			>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
