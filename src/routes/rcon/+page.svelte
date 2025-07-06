<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
	import { RustRconConnection } from './rust-rcon'

	let rcon: RustRconConnection = null!

	onMount(async () => {
		rcon = new RustRconConnection('ws://localhost:24247/1jEIXkbSQty3')

		await rcon.connect()
		const response = await rcon.sendCommand('c.version')
		console.log('response', response)
	})

	onDestroy(() => {
		rcon?.disconnect()
		rcon = null!
	})
</script>

<div>
	<h1>RCON</h1>
</div>
