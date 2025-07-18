<script lang="ts">
	import { page } from '$app/state'
	import { Button } from '$lib/components/ui/button/index.js'
	import { Checkbox } from '$lib/components/ui/checkbox/index.js'
	import { Input } from '$lib/components/ui/input/index.js'
	import { Label } from '$lib/components/ui/label/index.js'
	import { getConfigStateContext } from '$lib/config-state.svelte'
	import Loader2Icon from '@lucide/svelte/icons/loader-2'
	import type { RustServer } from './rust-server.svelte.ts'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	const configState = getConfigStateContext()

	let form = $state({
		ipPortInvalid: false,
		passwordInvalid: false,
		error: '',
		isAwaitingResponse: false,
	})

	let isIpIsLocal: boolean = $derived.by(() => {
		const ip = server.configServer.address.split(':')[0]
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
		!isIpIsLocal &&
			!!server.configServer.address &&
			page.url.protocol !== 'http:' &&
			!server.configServer.useSecureWebsocket &&
			!configState.iKnow
	)

	function validate() {
		if (!server.configServer.address) {
			form.ipPortInvalid = true
			form.error = 'Server Address is required.'
			return false
		}

		const ipPortRegex = /^[^:]+:\d{1,5}$/
		if (!ipPortRegex.test(server.configServer.address)) {
			form.ipPortInvalid = true
			form.error = 'Invalid Server Address format. Please use IP:Port.'
			return false
		}

		if (!server.configServer.password) {
			form.passwordInvalid = true
			form.error = 'RCon Password is required.'
			return false
		}

		return true
	}

	async function tryConnect(e: Event) {
		e.preventDefault()
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

<div class="flex w-full max-w-sm flex-col gap-6 self-center text-center">
	<div class="flex flex-col gap-2">
		<h1 class="text-3xl font-bold">Connect to Server</h1>
		<p class="text-muted-foreground text-balance">Enter your server details to connect via RCon.</p>
	</div>
	<form onsubmit={tryConnect} class="flex flex-col gap-6 text-left">
		<div class="grid gap-2">
			<Label for="server-address">Server Address</Label>
			<Input
				class={form.ipPortInvalid ? 'ring-destructive ring-2' : ''}
				id="server-address"
				type="text"
				placeholder="IP:Port"
				autocomplete="off"
				bind:value={server.configServer.address}
				oninput={() => (form.ipPortInvalid = false)}
				disabled={form.isAwaitingResponse}
			/>

			{#if showMixedContentWarning}
				<p class="text-muted-foreground text-xs">
					Your browser may block insecure WebSocket (<code>ws://</code>) connections when trying to connect to
					remote server.
				</p>
				<p class="text-muted-foreground text-xs">
					You should use a secure WebSocket (<code>wss://</code>) if your server has it setup. (X509 cert,
					rust switches)
				</p>
				<p class="text-muted-foreground text-xs">
					<button
						type="button"
						class="cursor-pointer underline"
						onclick={() => {
							configState.iKnow = true
						}}>I know, I know</button
					>
				</p>
			{/if}
		</div>

		<div class="grid gap-2">
			<Label for="server.configServer.password">RCon Password</Label>
			<Input
				class={form.passwordInvalid ? 'ring-destructive ring-2' : ''}
				id="server.configServer.password"
				type="password"
				placeholder="Password"
				autocomplete="off"
				bind:value={server.configServer.password}
				oninput={() => (form.passwordInvalid = false)}
				disabled={form.isAwaitingResponse}
			/>
		</div>

		<div class="flex items-start gap-3">
			<Checkbox
				id="use-secure"
				bind:checked={server.configServer.useSecureWebsocket}
				disabled={form.isAwaitingResponse}
			/>
			<Label for="use-secure">Use secure (wss://)</Label>
		</div>

		<div class="flex items-start gap-3">
			<Checkbox
				id="save-password"
				bind:checked={server.configServer.savePassword}
				disabled={form.isAwaitingResponse}
			/>
			<Label for="save-password">Save Password (inside browser)</Label>
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
</div>
