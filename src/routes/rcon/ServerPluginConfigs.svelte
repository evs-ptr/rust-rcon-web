<script lang="ts">
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
	import { onDestroy, onMount } from 'svelte'
	import { parseConfigContentGzip } from './rust-rcon-plugin-configs'
	import type { RustServer } from './rust-server.svelte'
	import { getServerPluginConfigsStore, type ServerPluginConfigsStore } from './server-plugin-configs.svelte'

	let editor: Monaco.editor.IStandaloneCodeEditor
	let monaco: typeof Monaco

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	let config = getConfigGlobalContext()
	let store: ServerPluginConfigsStore = $derived(getServerPluginConfigsStore(server.id, config))

	$effect(() => {
		store.tryPopulate(server)
	})

	let value = $state('')
	let dom: HTMLDivElement | undefined = $state()

	onMount(async () => {
		const resp = await server.sendCommandGetResponse('c.webrcon.rpc 2553096967 NTeleportation.json')
		if (!resp) {
			console.error('Failed to get configs')
			return
		}
		const content = await parseConfigContentGzip(resp)
		if (!content) {
			console.error('Failed to parse configs')
			return
		}
		value = content
		monaco = (await import('./monaco')).default

		editor = monaco.editor.create(dom!)
		const model = monaco.editor.createModel(value, 'json')
		editor.setModel(model)
	})

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose())
		editor?.dispose()
	})
</script>

<div class="bg-card rounded-md border p-2">
	<div bind:this={dom} class="h-[600px] overflow-y-scroll overscroll-contain"></div>
	{#each store.infos as info}
		{info.Name}
	{/each}
</div>
