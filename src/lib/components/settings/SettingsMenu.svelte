<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
	import { buttonVariants } from '$lib/components/ui/button/index.js'
	import { Input } from '$lib/components/ui/input/index.js'
	import { Label } from '$lib/components/ui/label/index.js'
	import * as Sheet from '$lib/components/ui/sheet/index.js'
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import SettingsIcon from '@lucide/svelte/icons/settings'

	const config = getConfigGlobalContext()

	function saveConfig() {
		config.save()
	}

	function resetToDefaultConfig() {
		config.resetToDefault()
	}

	let alertResetOpen: boolean = $state(false)
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
				<Input id="name" type="number" bind:value={config.consoleHistoryClamp} />
			</div>
		</div>
		<Sheet.Footer class="flex flex-col gap-4 sm:flex-row sm:gap-2">
			<AlertDialog.Root bind:open={alertResetOpen}>
				<AlertDialog.Trigger class={buttonVariants({ variant: 'outline' })}
					>Reset to Default</AlertDialog.Trigger
				>
				<AlertDialog.Content interactOutsideBehavior="close">
					<AlertDialog.Header>
						<AlertDialog.Title>Are you sure?</AlertDialog.Title>
						<AlertDialog.Description class="flex flex-col gap-4 text-pretty">
							<p>This will reset all of your settings to default ones.</p>
							<p>
								Note: you still have to press <strong>Save Settings</strong> button to override stored ones with
								defaults.
							</p>
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action
							onclick={() => {
								resetToDefaultConfig()
								alertResetOpen = false
							}}>Continue</AlertDialog.Action
						>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
			<Sheet.Close class={[buttonVariants({ variant: 'default' }), 'grow']} onclick={saveConfig}
				>Save Settings to Storage</Sheet.Close
			>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
