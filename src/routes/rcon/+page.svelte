<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
	import { RustRconConnection } from './rust-rcon'

	let rcon: RustRconConnection = null!

	onMount(async () => {
		rcon = new RustRconConnection('ws://localhost:24247/1jEIXkbSQty3')

		await rcon.connect()
		const response = await rcon.sendCommandGetResponse('c.version')
		console.log('response', response)

		const response2 = await rcon.sendCommandGetResponse('c.help')
		console.log('response2', response2)

		const response3 = await rcon.sendCommandGetResponse('console.tail 100')
		console.log('response3', response3)
	})

	onDestroy(() => {
		rcon?.disconnect()
		rcon = null!
	})
</script>

<div>
	<h1>RCON</h1>
</div>
