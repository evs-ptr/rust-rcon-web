<script lang="ts">
	import { browser } from '$app/environment'
	import { Button } from '$lib/components/ui/button/index.js'
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import { mode } from 'mode-watcher'
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
	import { onDestroy, untrack } from 'svelte'
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

	let dom: HTMLDivElement | undefined = $state()

	$effect(() => {
		store.tryPopulate(server)
	})

	function updateTheme() {
		mode.current === 'dark' ? monaco?.editor.setTheme('vs-dark') : monaco?.editor.setTheme('vs')
	}

	$effect(() => {
		updateTheme()
	})

	$effect(() => {
		if (store.selectedFile) {
			untrack(updateEditor)
		}
	})

	async function updateEditor() {
		if (!browser || !dom) {
			return
		}

		if (!store.selectedFile) {
			return
		}

		cleanUpEditor()
		const resp = await server.sendCommandGetResponse(
			constructRpcCommand(RpcIds.GetConfigContent, [store.selectedFile, '--gzip'])
		)
		if (!resp) {
			console.error('Failed to get config content')
			return
		}
		const content = await parseConfigContentGzip(resp)
		if (content == null) {
			console.error('Failed to parse config')
			return
		}

		monaco = (await import('./monaco')).default
		updateTheme()
		editor = monaco.editor.create(dom!, {
			value: content,
			language: 'json',
			automaticLayout: true,
		})
	}

	function cleanUpEditor() {
		monaco?.editor.getModels().forEach((model) => model.dispose())
		editor?.dispose()
	}

	onDestroy(() => {
		cleanUpEditor()
	})
</script>

<div class="bg-card flex rounded-md border">
	<div class="flex flex-col gap-1">
		{#each store.infos as info (info.Name)}
			<Button onclick={() => (store.selectedFile = info.Name)} variant="ghost">
				{info.Name}
			</Button>
		{/each}
	</div>
	{#if store.selectedFile}
		<div style="height: 700px;" bind:this={dom}></div>
	{/if}
</div>
