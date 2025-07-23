<script lang="ts">
	import { browser } from '$app/environment'
	import { mode } from 'mode-watcher'
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
	import { onDestroy, tick, untrack } from 'svelte'

	let {
		value,
		language,
		onchange,
		onsave,
	}: {
		value: string
		language: string
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
			if (currentValue !== undefined && currentValue !== value) {
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
		if (!monaco) {
			return
		}

		if (mode.current === 'dark') {
			monaco.editor.setTheme('vs-dark')
		} else {
			monaco.editor.setTheme('vs')
		}
	}

	onDestroy(() => {
		cleanUpEditor()
	})

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		mode.current
		updateTheme()
	})

	$effect(() => {
		if (dom) {
			untrack(updateEditor)
		}
	})

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		value
		if (editor && value != editor.getValue()) {
			editor.setValue(value)
		}
	})

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		language
		if (editor && language) {
			const model = editor.getModel()
			if (model) {
				monaco.editor.setModelLanguage(model, language)
			}
		}
	})
</script>

<div class="absolute inset-0" bind:this={dom}></div>
