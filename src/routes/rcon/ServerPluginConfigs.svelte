<script lang="ts">
	import { browser } from '$app/environment'
	import { Button } from '$lib/components/ui/button/index.js'
	import { Separator } from '$lib/components/ui/separator/index.js'
	import * as Tooltip from '$lib/components/ui/tooltip/index.js'
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import { mode } from 'mode-watcher'
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
	import { onDestroy, untrack } from 'svelte'
	import { parseConfigContentGzip } from './rust-rcon-plugin-configs'
	import { constructRpcCommand, RpcIds } from './rust-rcon-rpc'
	import type { RustServer } from './rust-server.svelte'
	import { getServerPluginConfigsStore, type ServerPluginConfigsStore } from './server-plugin-configs.svelte'

	let editor: Monaco.editor.IStandaloneCodeEditor | undefined = $state()
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

	function writeConfig() {
		const content = editor?.getValue()

		if (content != null) {
			store.writeConfig(server, content)
		}
	}

	onDestroy(() => {
		cleanUpEditor()
	})
</script>

<h1>UNDER CONSTRUCTION</h1>

<div class="flex flex-col gap-2">
	<div class="bg-card flex h-[700px] rounded-md border">
		<div class="flex w-52 flex-col gap-1 overflow-x-auto overflow-y-auto overscroll-contain p-2">
			{#each store.infos as info (info.Name)}
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger class="w-full">
							<Button
								onclick={() => (store.selectedFile = info.Name)}
								variant={store.selectedFile === info.Name ? 'secondary' : 'ghost'}
								class="w-full justify-start truncate"
							>
								{info.Name}
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>{info.Name}</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			{/each}
		</div>
		<Separator orientation="vertical" />
		{#if store.selectedFile}
			<div class="w-full" bind:this={dom}></div>
		{:else}
			<div class="text-muted-foreground flex flex-1 items-center justify-center">
				<span>Select a file</span>
			</div>
		{/if}
	</div>

	<div class="flex justify-end gap-2">
		{#if store.selectedFile && editor}
			<Button onclick={() => writeConfig()}>Save</Button>
		{/if}
	</div>
</div>
