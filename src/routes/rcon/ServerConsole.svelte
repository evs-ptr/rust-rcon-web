<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
	import type { CommandResponse } from './rust-rcon'
	import type { RustServer } from './rust-server.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	const SUBSCRIBE_ID = 'cnsle'
	let unsubscribe: (() => void) | null = null

	function onMessage(msg: CommandResponse) {
		console.log(msg)
	}

	onMount(() => {
		unsubscribe = server.subscribeOnMessage(SUBSCRIBE_ID, onMessage)
		server.sendCommand('console.tail 100')
	})

	onDestroy(() => {
		unsubscribe?.()
	})
</script>

<div class="flex flex-col gap-2"></div>
