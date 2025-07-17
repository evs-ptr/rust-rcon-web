<script lang="ts">
	import type { ServerInfo } from './rust-rcon.types'
	import type { RustServer } from './rust-server.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	const INTERVAL_MS: number = 5_650
	const COMMAND_SERVER_INFO: string = 'global.serverinfo'

	let serverInfo: ServerInfo | null = $state(null)

	let interval: ReturnType<typeof setInterval> | null = null

	function parseServerInfo(json: string): ServerInfo | null {
		try {
			const parsed = JSON.parse(json)
			return parsed as ServerInfo
		} catch (e) {
			console.error('Error while parsing server info', e)
		}
		return null
	}

	async function getServerInfo(): Promise<ServerInfo | null> {
		const resp = await server.sendCommandGetResponse(COMMAND_SERVER_INFO)
		const msg = resp?.Message
		if (resp && msg) {
			return parseServerInfo(msg)
		}

		return null
	}

	async function intervalTick() {
		const info = await getServerInfo()
		if (info) {
			serverInfo = info
		}
	}

	function setUp() {
		intervalTick()
		interval = setInterval(() => intervalTick(), INTERVAL_MS)
	}

	function cleanUp() {
		if (interval != null) {
			clearInterval(interval)
		}
	}

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		server.id

		cleanUp()
		setUp()
		return () => {
			cleanUp()
		}
	})
</script>

<div>
	<span class="font-mono text-sm whitespace-pre">{JSON.stringify(serverInfo, undefined, 2)}</span>
</div>
