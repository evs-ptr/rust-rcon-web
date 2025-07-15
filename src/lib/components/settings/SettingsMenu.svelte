<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
	import { buttonVariants } from '$lib/components/ui/button/index.js'
	import { Separator } from '$lib/components/ui/separator/index.js'
	import * as Sheet from '$lib/components/ui/sheet/index.js'
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import SettingsIcon from '@lucide/svelte/icons/settings'
	import SettingsInput from './SettingsInput.svelte'
	import SettingsSwitchInput from './SettingsSwitchInput.svelte'

	const config = getConfigGlobalContext()

	function saveConfig() {
		config.save()
	}

	function resetAndSaveConfig() {
		config.resetToDefault()
		config.save()
	}

	function commonValValidCheck(val: number) {
		return Number.isInteger(val) && val > 0
	}

	let alertResetOpen: boolean = $state(false)
</script>

<Sheet.Root>
	<Sheet.Trigger class={buttonVariants({ variant: 'outline' })}>
		<SettingsIcon />
	</Sheet.Trigger>
	<Sheet.Content class="flex flex-col">
		<Sheet.Header class="border-b">
			<Sheet.Title>Global Settings</Sheet.Title>
			<Sheet.Description>
				These settings are stored in your browser and apply to all servers you connect to.
			</Sheet.Description>
		</Sheet.Header>
		<div class="grid flex-1 auto-rows-min gap-6 overflow-y-auto px-4">
			<div class="grid gap-8">
				<h3 class="text-lg font-medium">General</h3>
				<SettingsInput
					bind:value={config.consoleHistoryFetch}
					validator={commonValValidCheck}
					id="console-history-fetch"
					label="Initial History Fetch"
				>
					{#snippet description()}
						The number of console lines to load when you first connect to a server.
					{/snippet}
				</SettingsInput>
			</div>

			<Separator />

			<div class="grid gap-8">
				<h3 class="text-lg font-medium">Chat</h3>
				<SettingsSwitchInput
					bind:value={config.consoleChatInclude}
					id="include-chat"
					label="Show Chat in Console"
				>
					{#snippet description()}
						Display player chat messages alongside regular console output.
					{/snippet}
				</SettingsSwitchInput>
				<SettingsInput
					bind:value={config.consoleChatHistoryFetch}
					validator={commonValValidCheck}
					id="chat-history-fetch"
					label="Chat History Fetch"
				>
					{#snippet description()}
						The number of chat messages to load when you first connect.
					{/snippet}
				</SettingsInput>
			</div>

			<Separator />

			<div class="grid gap-8">
				<h3 class="text-lg font-medium">History Limiting</h3>
				<SettingsSwitchInput
					bind:value={config.consoleHistoryClampEnable}
					id="enable-history-clamp"
					label="Enable History Limit"
				>
					{#snippet description()}
						Automatically remove old console entries to prevent performance issues.
					{/snippet}
				</SettingsSwitchInput>
				<SettingsInput
					bind:value={config.consoleHistoryClamp}
					validator={commonValValidCheck}
					id="history-clamp-value"
					label="History Limit"
				>
					{#snippet description()}
						The maximum number of console lines to keep in memory.
					{/snippet}
				</SettingsInput>
			</div>
		</div>
		<Sheet.Footer class="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:gap-2">
			<AlertDialog.Root bind:open={alertResetOpen}>
				<AlertDialog.Trigger class={buttonVariants({ variant: 'outline' })}
					>Reset to Default</AlertDialog.Trigger
				>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Are you sure?</AlertDialog.Title>
						<AlertDialog.Description>
							This will reset all settings to their defaults and save the changes immediately. This action
							cannot be undone.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action
							onclick={() => {
								resetAndSaveConfig()
								alertResetOpen = false
							}}>Continue</AlertDialog.Action
						>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
			<Sheet.Close class={[buttonVariants({ variant: 'default' }), 'grow']} onclick={saveConfig}
				>Save and Write</Sheet.Close
			>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
