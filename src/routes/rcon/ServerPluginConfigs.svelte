<script lang="ts">
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import { mode } from 'mode-watcher'
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
	import { onDestroy, onMount } from 'svelte'
	import { parseConfigContentGzip } from './rust-rcon-plugin-configs'
	import { constructRpcCommand, RpcIds } from './rust-rcon-rpc'
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

	$effect(() => {
		updateTheme()
	})

	let dom: HTMLDivElement | undefined = $state()

	function updateTheme() {
		mode.current === 'dark' ? monaco?.editor.setTheme('vs-dark') : monaco?.editor.setTheme('vs')
	}

	onMount(async () => {
		const resp = await server.sendCommandGetResponse(
			constructRpcCommand(RpcIds.GetConfigContent, ['NTeleportation.json', '--gzip'])
		)
		if (!resp) {
			console.error('Failed to get configs')
			return
		}
		const content = await parseConfigContentGzip(resp)
		if (!content) {
			console.error('Failed to parse configs')
			return
		}

		monaco = (await import('./monaco')).default
		updateTheme()
		editor = monaco.editor.create(dom!, {
			value: content,
			language: 'json',
			automaticLayout: true,
		})
	})

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose())
		editor?.dispose()
	})
</script>

<div class="bg-card rounded-md border">
	<div bind:this={dom} class="h-[700px]"></div>
	{#each store.infos as info (info.Name)}
		{info.Name}
	{/each}
</div>
