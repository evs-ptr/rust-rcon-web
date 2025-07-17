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

	type CardItemData = {
		icon: typeof ServerIcon
		label: string
		value: string | string[]
	}

	type CardData = {
		headerIcon: typeof ServerIcon
		header: string
		description: string
		cardItems: CardItemData[]
	}

	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()

	const INTERVAL_MS: number = 5_650
	const COMMAND_SERVER_INFO: string = 'global.serverinfo'

	let interval: ReturnType<typeof setTimeout> | null = null

	let serverInfo: ServerInfo | null = $state(null)
	let cardsData: CardData[] | null = $derived(serverInfo ? constructCardsData(serverInfo) : null)

	function constructCardsData(info: ServerInfo): CardData[] {
		return [
			{
				headerIcon: ServerIcon,
				header: info.Hostname,
				description: `Version ${info.Version} (${info.Protocol})`,
				cardItems: [
					{ icon: MapIcon, label: 'Map', value: info.Map },
					{ icon: ClockIcon, label: 'Uptime', value: formatUptime(info.Uptime) },
					{ icon: CalendareIcon, label: 'Game Time', value: formatDate(info.GameTime) },
				],
			},
			{
				headerIcon: UsersIcon,
				header: 'Players',
				description: `${info.Players} / ${info.MaxPlayers} online`,
				cardItems: [
					{ icon: LogInIcon, label: 'Joining', value: info.Joining.toString() },
					{ icon: PowerIcon, label: 'Queued', value: info.Queued.toString() },
				],
			},
			{
				headerIcon: MonitorCogIcon,
				header: 'System',
				description: 'Internal server details',
				cardItems: [
					{ icon: CpuIcon, label: 'Entity Count', value: info.EntityCount.toString() },
					{ icon: CpuIcon, label: 'Collections', value: info.Collections.toString() },
					{
						icon: CalendareIcon,
						label: 'Save Created Time',
						value: formatDate(info.SaveCreatedTime),
					},
				],
			},
			{
				headerIcon: MonitorCogIcon,
				header: 'Performance',
				description: 'Real-time server performance',
				cardItems: [
					{ icon: GaugeIcon, label: 'Framerate', value: `${info.Framerate} FPS` },
					{ icon: CpuIcon, label: 'Memory', value: formatBytes(info.Memory) },
					{ icon: NetworkIcon, label: 'Network In', value: formatBytes(info.NetworkIn) },
					{ icon: NetworkIcon, label: 'Network Out', value: formatBytes(info.NetworkOut) },
				],
			},
		]
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

		if (interval != null) {
			interval = setTimeout(intervalTick, INTERVAL_MS)
		}
	}

	function setUp() {
		interval = setTimeout(intervalTick, 0)
	}

	function cleanUp() {
		if (interval != null) {
			clearTimeout(interval)
			interval = null
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

<div class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
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
	{:else}
		{#each Array(4), i (i)}
			<Card.Root class="bg-transparent">
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<div class="bg-muted size-6 animate-pulse rounded-full"></div>
						<div class="bg-muted h-6 w-32 animate-pulse rounded-lg"></div>
					</Card.Title>
					<Card.Description>
						<div class="bg-muted h-4 w-48 animate-pulse rounded-lg"></div>
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-4">
					{#each Array(3), j (j)}
						<div class="flex items-center justify-between text-sm">
							<div class="flex items-center gap-2">
								<div class="bg-muted size-5 animate-pulse rounded-lg"></div>
								<div class="bg-muted h-5 w-20 animate-pulse rounded-lg"></div>
							</div>
							<div class="bg-muted h-5 w-16 animate-pulse rounded-lg"></div>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>
		{/each}
	{/if}
</div>

{#snippet cardItemSnippet(item: CardItemData)}
	<div class="flex items-center justify-between text-sm">
		<div class="flex items-center gap-2 text-balance">
			<item.icon class="text-muted-foreground size-5" />
			<span class="font-medium">{item.label}</span>
		</div>
		<div class="flex flex-col text-right font-mono text-xs text-balance">
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
