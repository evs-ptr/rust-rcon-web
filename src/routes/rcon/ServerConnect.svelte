<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import type { RustServer } from './rust-server.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	function tryConnect() {
		server.connect()
	}
</script>

<form onsubmit={tryConnect} class="flex w-full max-w-sm flex-col gap-4 self-center">
	<div class="grid gap-2">
		<Label for="server-address">Server Address</Label>
		<Input
			id="server-address"
			type="text"
			placeholder="IP:Port"
			autocomplete="off"
			bind:value={server.ipPort}
		/>
	</div>

	<div class="grid gap-2">
		<Label for="server-password">RCON Password</Label>
		<Input
			id="server-password"
			type="password"
			placeholder="Password"
			autocomplete="off"
			bind:value={server.password}
		/>
	</div>

	<Button type="submit">Connect</Button>
</form>
