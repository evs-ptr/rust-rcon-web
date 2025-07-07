<script lang="ts">
	import type { RustServer } from './rust-server.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()
</script>

<div>
	<h2>Server: {server.ipPort}</h2>
</div>
