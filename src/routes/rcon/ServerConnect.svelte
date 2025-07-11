<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import * as Card from '$lib/components/ui/card/index'
	import { Checkbox } from '$lib/components/ui/checkbox'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import type { RustServer } from './rust-server.svelte'
	import { Loader2Icon } from '@lucide/svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	let form = $state({
		ipPortInvalid: false,
		passwordInvalid: false,
		error: '',
		isAwaitingResponse: false
	})

	function validate() {
		if (!server.ipPort) {
			form.ipPortInvalid = true
			form.error = 'Server Address is required.'
			return false
		}

		const ipPortRegex = /^[^:]+:\d{1,5}$/
		if (!ipPortRegex.test(server.ipPort)) {
			form.ipPortInvalid = true
			form.error = 'Invalid Server Address format. Please use IP:Port.'
			return false
		}

		if (!server.password) {
			form.passwordInvalid = true
			form.error = 'RCON Password is required.'
			return false
		}

		return true
	}

	async function tryConnect() {
		form.error = ''
		form.ipPortInvalid = false
		form.passwordInvalid = false

		if (!validate()) {
			return
		}

		form.isAwaitingResponse = true

		try {
			await server.connect()
		} catch {
			form.error = 'Failed to connect. Please verify the IP, port, and password.'
		}

		form.isAwaitingResponse = false
	}
</script>

<Card.Root class="w-full max-w-sm self-center">
	<Card.Header>
		<Card.Title>Connect to Server</Card.Title>
		<Card.Description>Enter your server details to connect via RCon.</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={tryConnect} class="flex flex-col gap-6">
			<div class="grid gap-2">
				<Label for="server-address">Server Address</Label>
				<Input
					class={form.ipPortInvalid ? 'ring-destructive ring-2' : ''}
					id="server-address"
					type="text"
					placeholder="IP:Port"
					autocomplete="off"
					bind:value={server.ipPort}
					oninput={() => (form.ipPortInvalid = false)}
					disabled={form.isAwaitingResponse}
				/>
			</div>

			<div class="grid gap-2">
				<Label for="server-password">RCON Password</Label>
				<Input
					class={form.passwordInvalid ? 'ring-destructive ring-2' : ''}
					id="server-password"
					type="password"
					placeholder="Password"
					autocomplete="off"
					bind:value={server.password}
					oninput={() => (form.passwordInvalid = false)}
					disabled={form.isAwaitingResponse}
				/>
			</div>

			<div class="flex items-start gap-3">
				<Checkbox
					id="use-secure"
					bind:checked={server.useSecureWebSocket}
					disabled={form.isAwaitingResponse}
				/>
				<Label for="use-secure">Use secure (wss://)</Label>
			</div>

			{#if form.error}
				<p class="text-destructive text-sm">{form.error}</p>
			{/if}

			<Button type="submit" class="w-full" disabled={form.isAwaitingResponse}>
				{#if form.isAwaitingResponse}
					<Loader2Icon class="animate-spin" />
				{:else}
					Connect
				{/if}
			</Button>
		</form>
	</Card.Content>
</Card.Root>
