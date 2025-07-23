<script lang="ts">
	import { browser } from '$app/environment'
	import { mode } from 'mode-watcher'
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
	import { onDestroy, tick, untrack } from 'svelte'

	let {
		value,
		language = 'json',
		onchange,
		onsave,
	}: {
		value: string
		language?: string
		onchange?: (value: string) => void
		onsave?: () => void
	} = $props()

	let dom: HTMLDivElement | undefined = $state()
	let editor: Monaco.editor.IStandaloneCodeEditor | undefined
	let monaco: typeof Monaco

	async function updateEditor() {
		await tick()
		if (!browser || !dom) {
			return
		}

		cleanUpEditor()

		monaco = (await import('../../routes/rcon/monaco')).default
		updateTheme()
		editor = monaco.editor.create(dom, {
			value: value,
			language: language,
			automaticLayout: true,
		})

		editor.onDidChangeModelContent(() => {
			const currentValue = editor?.getValue()
			if (currentValue !== undefined) {
				onchange?.(currentValue)
			}
		})

		editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
			onsave?.()
		})
	}

	function cleanUpEditor() {
		monaco?.editor.getModels().forEach((model) => model.dispose())
		editor?.dispose()
	}

	function updateTheme() {
		if (mode.current === 'dark') {
			monaco?.editor.setTheme('vs-dark')
		} else {
			monaco?.editor.setTheme('vs')
		}
	}

	onDestroy(() => {
		cleanUpEditor()
	})

	$effect(() => {
		updateTheme()
	})

	$effect(() => {
		if (dom) {
			untrack(updateEditor)
		}
	})
</script>

<div class="absolute inset-0" bind:this={dom}></div>
