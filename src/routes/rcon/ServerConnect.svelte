<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import * as Card from '$lib/components/ui/card/index'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import type { RustServer } from './rust-server.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	let inp1Invalid = $state(false)
	let inp2Invalid = $state(false)
	let error = $state('')

	async function tryConnect() {
		error = ''
		inp1Invalid = false
		inp2Invalid = false

		if (!server.ipPort) {
			inp1Invalid = true
			error = 'Server Address is required.'
			return
		}

		const ipPortRegex = /^[^:]+:\d{1,5}$/
		if (!ipPortRegex.test(server.ipPort)) {
			inp1Invalid = true
			error = 'Invalid Server Address format. Please use IP:Port.'
			return
		}

		if (!server.password) {
			inp2Invalid = true
			error = 'RCON Password is required.'
			return
		}

		try {
			await server.connect()
		} catch {
			error = 'Failed to connect. Please verify the IP, port, and password.'
			return
		}
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
					aria-invalid={inp1Invalid}
					id="server-address"
					type="text"
					placeholder="IP:Port"
					autocomplete="off"
					bind:value={server.ipPort}
					oninput={() => (inp1Invalid = false)}
				/>
			</div>

			<div class="grid gap-2">
				<Label for="server-password">RCON Password</Label>
				<Input
					aria-invalid={inp2Invalid}
					id="server-password"
					type="password"
					placeholder="Password"
					autocomplete="off"
					bind:value={server.password}
					oninput={() => (inp2Invalid = false)}
				/>
			</div>

			{#if error}
				<p class="text-destructive text-sm">{error}</p>
			{/if}

			<Button type="submit" class="w-full">Connect</Button>
		</form>
	</Card.Content>
</Card.Root>
