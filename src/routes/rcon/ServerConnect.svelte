<script lang="ts">
	import { page } from '$app/state'
	import { Button } from '$lib/components/ui/button/index.js'
	import * as Card from '$lib/components/ui/card/index.js'
	import { Checkbox } from '$lib/components/ui/checkbox/index.js'
	import { Input } from '$lib/components/ui/input/index.js'
	import { Label } from '$lib/components/ui/label/index.js'
	import Loader2Icon from '@lucide/svelte/icons/loader-2'
	import type { RustServer } from './rust-server.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	let form = $state({
		ipPortInvalid: false,
		passwordInvalid: false,
		error: '',
		isAwaitingResponse: false,
	})

	let isIpIsLocal: boolean = $derived.by(() => {
		const ip = server.ipPort.split(':')[0]
		if (ip == 'localhost') {
			return true
		}

		const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
		if (!ipv4Regex.test(ip)) {
			return false // Not a valid IPv4 address
		}

		const parts = ip.split('.').map(Number)

		// 127.0.0.0/8
		if (parts[0] === 127) {
			return true
		}
		// 10.0.0.0/8
		if (parts[0] === 10) {
			return true
		}

		return false
	})

	let showMixedContentWarning: boolean = $derived(
		!isIpIsLocal && !!server.ipPort && page.url.protocol === 'http:' && !server.useSecureWebSocket
	)

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

				{#if showMixedContentWarning}
					<p class="text-muted-foreground text-xs">
						Your browser may block insecure WebSocket (<code>ws://</code>) connections when using a secure (<code
							>https://</code
						>) page and connecting to remote server.
					</p>
					<p class="text-muted-foreground text-xs">
						To connect, either use a secure WebSocket (<code>wss://</code>) if your server supports it, or
						access this web interface via <code>http://</code>
					</p>
				{/if}
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
