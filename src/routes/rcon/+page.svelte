<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
	import { createServersManager } from './servers-manager.svelte'
	import { RustRconConnection } from './rust-rcon'
	import ServersChooser from './ServersChooser.svelte'
	import type { RustServer } from './rust-server.svelte'

	const serversManager = createServersManager()
	let selectedServer = $state<RustServer | null>(null)

	// let rcon: RustRconConnection = null!

	// let inputUrl = $state('ws://localhost:24247/1jEIXkbSQty3')
	// let inputPassword = $state('1jEIXkbSQty3')

	// async function connect() {
	// 	rcon = new RustRconConnection(inputUrl)
	// 	await rcon.connect()
	// }

	// onMount(async () => {})

	// onDestroy(() => {
	// 	rcon?.disconnect()
	// 	rcon = null!
	// })
</script>

<div>
	<h1>RCON</h1>
	<ServersChooser {serversManager} bind:selectedServer />
	{#if selectedServer}
		<div>
			<h2>Server: {selectedServer.ipPort}</h2>
		</div>
	{/if}
	<!-- <input class="dark:bg-zinc-700" type="text" bind:value={inputUrl} placeholder="URL" />
	<input type="text" bind:value={inputPassword} placeholder="Password" />
	<button class="" disabled={!inputUrl || !inputPassword} onclick={connect}>Connect</button> -->
</div>
