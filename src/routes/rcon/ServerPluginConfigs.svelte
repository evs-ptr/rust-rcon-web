<script lang="ts">
	import MonacoEditor from '$lib/components/MonacoEditor.svelte'
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
	import { Button } from '$lib/components/ui/button/index.js'
	import { Separator } from '$lib/components/ui/separator/index.js'
	import * as Sheet from '$lib/components/ui/sheet/index.js'
	import * as Tooltip from '$lib/components/ui/tooltip/index.js'
	import { getConfigGlobalContext } from '$lib/config-global.svelte'
	import FileText from '@lucide/svelte/icons/file-text'
	import Loader2 from '@lucide/svelte/icons/loader-2'
	import { fade } from 'svelte/transition'
	import type { RustServer } from './rust-server.svelte'
	import { getServerPluginConfigsStore, type ServerPluginConfigsStore } from './server-plugin-configs.svelte'

	type SaveState = 'idle' | 'saving' | 'saved' | 'error'

	let sheetOpen = $state(false)
	let isLoading = $state(false)
	let editorContent = $state('')
	let isDirty = $state(false)
	let showDiscardDialog = $state(false)
	let pendingFileSelection: string | null = $state(null)
	let saveState: SaveState = $state('idle')

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	let config = getConfigGlobalContext()
	let store: ServerPluginConfigsStore = $derived(getServerPluginConfigsStore(server.id, config))

	let editorLanguage = $derived(getLanguageFromFileName(store.selectedFile))

	$effect(() => {
		store.tryPopulate(server)
	})

	$effect(() => {
		if (store.selectedFile) {
			loadFileContent(store.selectedFile)
		}
	})

	async function loadFileContent(fileName: string) {
		isLoading = true
		isDirty = false
		saveState = 'idle'
		try {
			const content = await store.getConfigContent(server, fileName)
			editorContent = content ?? ''
		} finally {
			isLoading = false
		}
	}

	async function writeConfig() {
		if (!isDirty) {
			return
		}

		saveState = 'saving'
		try {
			await store.writeConfig(server, editorContent)
			isDirty = false
			saveState = 'saved'
		} catch (e) {
			saveState = 'error'
			console.error('Failed to save config:', e)
		} finally {
			setTimeout(() => {
				saveState = 'idle'
			}, 2000)
		}
	}

	function handleFileSelect(fileName: string) {
		if (isDirty) {
			pendingFileSelection = fileName
			showDiscardDialog = true
		} else {
			store.selectedFile = fileName
		}
	}

	function confirmDiscard() {
		if (pendingFileSelection) {
			store.selectedFile = pendingFileSelection
			isDirty = false
		}
		closeDiscardDialog()
	}

	function closeDiscardDialog() {
		showDiscardDialog = false
		pendingFileSelection = null
	}

	function getLanguageFromFileName(fileName: string): string {
		if (!fileName) {
			return 'json'
		}
		const extension = fileName.split('.').pop()?.toLowerCase()
		switch (extension) {
			case 'json':
				return 'json'
			case 'toml':
				return 'toml'
			case 'yaml':
			case 'yml':
				return 'yaml'
			default:
				return 'json'
		}
	}
</script>

{#snippet fileList(mobile = false)}
	<div class="flex flex-col gap-1">
		{#if store.infos.length === 0}
			<p class="text-muted-foreground p-4 text-center text-sm">No configuration files found.</p>
		{:else}
			{#each store.infos as info (info.Name)}
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger class="w-full">
							<Button
								onclick={() => {
									handleFileSelect(info.Name)
									if (mobile) {
										sheetOpen = false
									}
								}}
								variant={store.selectedFile === info.Name ? 'secondary' : 'ghost'}
								class="w-full justify-start truncate"
							>
								{#if isDirty && store.selectedFile === info.Name}
									<span class="mr-2 text-blue-500">*</span>
								{/if}
								{info.Name}
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>{info.Name}</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			{/each}
		{/if}
	</div>
{/snippet}

<div class="flex h-full flex-col gap-4">
	<div class="md:hidden">
		<Sheet.Root bind:open={sheetOpen}>
			<Sheet.Trigger class="w-full">
				<Button variant="outline" class="w-full justify-start truncate">
					<FileText class="mr-2 h-4 w-4" />
					<span class="truncate">
						{#if isDirty && store.selectedFile}*{/if}{store.selectedFile || 'Select a file'}
					</span>
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
				<MonacoEditor
					value={editorContent}
					language={editorLanguage}
					key={server.id + '_' + store.selectedFile}
					onchange={(v) => {
						if (editorContent !== v) {
							isDirty = true
							editorContent = v
						}
						saveState = 'idle'
					}}
					onsave={writeConfig}
				/>
				{#if isLoading}
					<div class="absolute inset-0 flex items-center justify-center bg-black/20" transition:fade>
						<Loader2 class="text-muted-foreground h-8 w-8 animate-spin" />
					</div>
				{/if}
			{:else}
				<div class="text-muted-foreground flex h-full flex-1 items-center justify-center">
					<span>Select a file to view its content</span>
				</div>
			{/if}
		</div>
	</div>

	<div class="flex justify-end gap-2">
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						onclick={writeConfig}
						disabled={!store.selectedFile || !isDirty || saveState == 'saving' || saveState == 'saved'}
					>
						{#if saveState === 'saving'}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							<span>Saving...</span>
						{:else if saveState === 'saved'}
							<span>Saved!</span>
						{:else if saveState === 'error'}
							<span>Error!</span>
						{:else}
							<span>Save</span>
						{/if}
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					{#if !store.selectedFile}
						<p>Select a file to save</p>
					{:else if !isDirty}
						<p>No changes</p>
					{:else if saveState == 'saving'}
						<p>Saving...</p>
					{:else if saveState == 'saved'}
						<p>Saved!</p>
					{:else if saveState == 'error'}
						<p>Error!</p>
					{:else}
						<p>Save</p>
					{/if}
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</div>
</div>

<AlertDialog.Root bind:open={showDiscardDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>You have unsaved changes</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to discard your changes and switch to another file? Your changes will be lost.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={closeDiscardDialog}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDiscard}>Discard Changes</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
