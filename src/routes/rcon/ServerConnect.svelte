<script lang="ts">
	import type { RustServer } from './rust-server.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	function tryConnect() {
		server.connect()
	}
</script>

<form onsubmit={tryConnect} class="flex flex-col gap-2">
	<input type="text" autocomplete="off" bind:value={server.ipPort} />
	<input type="password" autocomplete="off" bind:value={server.password} />
	<button type="submit">Connect</button>
</form>
