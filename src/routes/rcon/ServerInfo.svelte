<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js'
	import CalendareIcon from '@lucide/svelte/icons/calendar'
	import ClockIcon from '@lucide/svelte/icons/clock'
	import CpuIcon from '@lucide/svelte/icons/cpu'
	import GaugeIcon from '@lucide/svelte/icons/gauge'
	import LogInIcon from '@lucide/svelte/icons/log-in'
	import MapIcon from '@lucide/svelte/icons/map'
	import MonitorCogIcon from '@lucide/svelte/icons/monitor-cog'
	import NetworkIcon from '@lucide/svelte/icons/network'
	import PowerIcon from '@lucide/svelte/icons/power'
	import ServerIcon from '@lucide/svelte/icons/server'
	import UsersIcon from '@lucide/svelte/icons/users'
	import type { ServerInfo } from './rust-rcon.types'
	import type { RustServer } from './rust-server.svelte'

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	const INTERVAL_MS: number = 5_650
	const COMMAND_SERVER_INFO: string = 'global.serverinfo'

	let interval: ReturnType<typeof setInterval> | null = null

	let serverInfo: ServerInfo | null = $state(null)
	let cardsData: CardData[] | null = $derived(serverInfo ? constructCardsData(serverInfo) : null)

	function constructCardsData(info: ServerInfo): CardData[] {
		const ret: CardData[] = [
			new CardData(ServerIcon, info.Hostname, `Version ${info.Version} (${info.Protocol})`, [
				new CardItemData(MapIcon, 'Map', info.Map),
				new CardItemData(ClockIcon, 'Uptime', formatUptime(info.Uptime)),
				new CardItemData(CalendareIcon, 'Game Time', formatDate(info.GameTime)),
			]),
			new CardData(UsersIcon, 'Players', `${info.Players} / ${info.MaxPlayers} online`, [
				new CardItemData(LogInIcon, 'Joining', info.Joining.toString()),
				new CardItemData(PowerIcon, 'Queued', info.Queued.toString()),
			]),
			new CardData(MonitorCogIcon, 'System', 'Internal server details', [
				new CardItemData(CpuIcon, 'Entity Count', info.EntityCount.toString()),
				new CardItemData(CpuIcon, 'Collections', info.Collections.toString()),
				new CardItemData(CalendareIcon, 'Save Created Time', formatDate(info.SaveCreatedTime)),
			]),
			new CardData(MonitorCogIcon, 'Performace', 'Real-time server performace', [
				new CardItemData(GaugeIcon, 'Framerate', `${info.Framerate} FPS`),
				new CardItemData(CpuIcon, 'Memory', formatBytes(info.Memory)),
				new CardItemData(NetworkIcon, 'Network In', formatBytes(info.NetworkIn)),
				new CardItemData(NetworkIcon, 'Network Out', formatBytes(info.NetworkOut)),
			]),
		]

		return ret
	}

	function formatUptime(seconds: number): string {
		const d = Math.floor(seconds / (3600 * 24))
		const h = Math.floor((seconds % (3600 * 24)) / 3600)
		const m = Math.floor((seconds % 3600) / 60)
		const s = Math.floor(seconds % 60)

		const dDisplay = d > 0 ? d + 'd ' : ''
		const hDisplay = h > 0 ? h + 'h ' : ''
		const mDisplay = m > 0 ? m + 'm ' : ''
		const sDisplay = s > 0 ? s + 's' : ''
		return (dDisplay + hDisplay + mDisplay + sDisplay).trim()
	}

	function formatBytes(bytes: number, decimals = 2): string {
		if (bytes === 0) return '0 B'
		const k = 1024
		const dm = decimals < 0 ? 0 : decimals
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
	}

	function formatDate(dateString: string): string[] | string {
		try {
			const [datePart, timePart] = dateString.split(' ')
			if (!datePart || !timePart) {
				return dateString
			}

			const [month, day, year] = datePart.split('/')
			return [`${year}-${month}-${day}`, `${timePart}`]
		} catch {
			return dateString
		}
	}

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
		if (msg) {
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

	class CardItemData {
		icon: typeof ServerIcon
		label: string
		value: string | string[]

		constructor(icon: typeof ServerIcon, header: string, value: string | string[]) {
			this.icon = icon
			this.label = header
			this.value = value
		}
	}

	class CardData {
		headerIcon: typeof ServerIcon
		header: string
		description: string
		cardItems: CardItemData[]

		constructor(
			headerIcon: typeof ServerIcon,
			header: string,
			description: string,
			cardItems: CardItemData[]
		) {
			this.headerIcon = headerIcon
			this.header = header
			this.description = description
			this.cardItems = cardItems
		}
	}
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
	{#if serverInfo && cardsData}
		{#each cardsData as card, i (i)}
			<Card.Root class="bg-transparent">
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<card.headerIcon />
						{card.header}
					</Card.Title>
					<Card.Description class="text-pretty">
						{card.description}
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-4">
					{#each card.cardItems as cardItem, j (j)}
						{@render cardItemSnippet(cardItem)}
					{/each}
				</Card.Content>
			</Card.Root>
		{/each}
	{/if}
</div>

{#snippet cardItemSnippet(item: CardItemData)}
	<div class="flex flex-row justify-between text-sm">
		<div class="flex flex-col gap-1.5 text-balance">
			<item.icon class="text-muted-foreground size-5" />
			<span class="font-medium">{item.label}</span>
		</div>
		<div class="flex flex-col gap-1.5 text-right font-mono text-xs text-balance">
			{#if Array.isArray(item.value)}
				{#each item.value as val, k (k)}
					<span>{val}</span>
				{/each}
			{:else}
				<span>{item.value}</span>
			{/if}
		</div>
	</div>
{/snippet}
