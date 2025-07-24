<script lang="ts" module>
	export const viewStates = new Map<string, Monaco.editor.ICodeEditorViewState | null>()
</script>

<script lang="ts">
	import { browser } from '$app/environment'
	import { mode } from 'mode-watcher'
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
	import { onDestroy } from 'svelte'

	let {
		value,
		language,
		key,
		onchange,
		onsave,
	}: {
		value: string
		language: string
		key: string
		onchange?: (value: string) => void
		onsave?: () => void
	} = $props()

	let dom: HTMLDivElement | undefined = $state.raw()
	let editor: Monaco.editor.IStandaloneCodeEditor | undefined = $state.raw()
	let monaco: typeof Monaco | undefined = $state.raw()

	let currentKey: string | undefined = $state()

	async function initializeEditor() {
		if (editor || !browser) {
			return
		}

		monaco = (await import('../../routes/rcon/monaco')).default

		editor = monaco.editor.create(dom!, {
			model: null,
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

		updateTheme()
	}

	function updateTheme() {
		if (!monaco || !editor) {
			return
		}
		const newTheme = mode.current === 'dark' ? 'vs-dark' : 'vs'
		monaco.editor.setTheme(newTheme)
	}

	$effect(() => {
		if (!browser) {
			return
		}

		initializeEditor()

		if (!editor || !monaco) {
			return
		}

		if (currentKey && currentKey !== key) {
			const lastModel = monaco.editor.getModel(monaco.Uri.parse(currentKey))
			if (lastModel) {
				viewStates.set(currentKey, editor.saveViewState())
			}
		}

		let newModel = monaco.editor.getModel(monaco.Uri.parse(key))
		if (!newModel) {
			newModel = monaco.editor.createModel(value, language, monaco.Uri.parse(key))
		}

		if (editor.getModel() !== newModel) {
			editor.setModel(newModel)
		}

		const savedViewState = viewStates.get(key)
		if (savedViewState) {
			editor.restoreViewState(savedViewState)
		}

		editor.focus()

		currentKey = key
	})

	$effect(() => {
		if (!editor || !monaco) {
			return
		}

		const model = monaco.editor.getModel(monaco.Uri.parse(key))
		if (model && model.getValue() !== value) {
			model.pushEditOperations(
				[],
				[
					{
						range: model.getFullModelRange(),
						text: value,
					},
				],
				() => null
			)
		}
	})

	$effect(() => {
		mode.current
		updateTheme()
	})

	onDestroy(() => {
		editor?.dispose()
	})
</script>

<div class="absolute inset-0" bind:this={dom}></div>
