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

<div class="flex flex-col gap-2">
	<input type="text" bind:value={server.ipPort} />
	<input type="password" bind:value={server.password} />
	<button onclick={tryConnect}>Connect</button>
</div>
