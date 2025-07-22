<script lang="ts">
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import type { RustServer } from './rust-server.svelte'
	import { getServerPluginConfigsStore, type ServerPluginConfigsStore } from './server-plugin-configs.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	let config = getConfigGlobalContext()
	let store: ServerPluginConfigsStore = $derived(getServerPluginConfigsStore(server.id, config))

	$effect(() => {
		store.tryPopulate(server)
	})
</script>

<div>
	{#each store.infos as info}
		{info.Name}
	{/each}
</div>
