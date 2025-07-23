<script lang="ts">
	import { browser } from '$app/environment'
	import { Button } from '$lib/components/ui/button/index.js'
	import { Separator } from '$lib/components/ui/separator/index.js'
	import * as Sheet from '$lib/components/ui/sheet/index.js'
	import * as Tooltip from '$lib/components/ui/tooltip/index.js'
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import FileText from '@lucide/svelte/icons/file-text'
	import { mode } from 'mode-watcher'
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
	import { onDestroy, untrack } from 'svelte'
	import { parseConfigContentGzip } from './rust-rcon-plugin-configs'
	import { constructRpcCommand, RpcIds } from './rust-rcon-rpc'
	import type { RustServer } from './rust-server.svelte'
	import { getServerPluginConfigsStore, type ServerPluginConfigsStore } from './server-plugin-configs.svelte'

	let editor: Monaco.editor.IStandaloneCodeEditor | undefined = $state()
	let monaco: typeof Monaco
	let sheetOpen = $state(false)

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
		if (store.selectedFile && dom) {
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
		editor = monaco.editor.create(dom, {
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

{#snippet fileList(mobile = false)}
	<Tooltip.Provider>
		<div class="flex flex-col gap-1">
			{#each store.infos as info (info.Name)}
				<Tooltip.Root>
					<Tooltip.Trigger class="w-full">
						<Button
							onclick={() => {
								store.selectedFile = info.Name
								if (mobile) {
									sheetOpen = false
								}
							}}
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
			{/each}
		</div>
	</Tooltip.Provider>
{/snippet}

<div class="flex flex-col gap-4">
	<div class="md:hidden">
		<Sheet.Root bind:open={sheetOpen}>
			<Sheet.Trigger class="w-full">
				<Button variant="outline" class="w-full justify-start truncate">
					<FileText class="mr-2 h-4 w-4" />
					<span class="truncate">{store.selectedFile || 'Select a file'}</span>
				</Button>
			</Sheet.Trigger>
			<Sheet.Content side="left" class="flex flex-col p-0">
				<Sheet.Header class="p-4">
					<Sheet.Title>Configuration Files</Sheet.Title>
				</Sheet.Header>
				<div class="overflow-y-auto p-2">
					{@render fileList(true)}
				</div>
			</Sheet.Content>
		</Sheet.Root>
	</div>

	<div class="bg-card flex h-[700px] rounded-md border">
		<div class="hidden w-52 flex-col overflow-y-auto overscroll-contain p-2 md:flex md:resize-x">
			{@render fileList()}
		</div>
		<Separator orientation="vertical" class="hidden md:block" />

		<div class="relative w-full">
			{#if store.selectedFile}
				<div class="absolute inset-0" bind:this={dom}></div>
			{:else}
				<div class="text-muted-foreground flex h-full flex-1 items-center justify-center">
					<span>Select a file to view its content</span>
				</div>
			{/if}
		</div>
	</div>

	<div class="flex justify-end gap-2">
		{#if store.selectedFile && editor}
			<Button onclick={() => writeConfig()}>Save</Button>
		{/if}
	</div>
</div>
