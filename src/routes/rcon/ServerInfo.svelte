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
		const ret: CardData[] = []

		ret.push(
			new CardData(ServerIcon, info.Hostname, `Version ${info.Version} (${info.Protocol})`, [
				new CardItemData(MapIcon, 'Map', info.Map),
				new CardItemData(ClockIcon, 'Uptime', info.Uptime.toString()), // format
				new CardItemData(CalendareIcon, 'Game Time', info.GameTime),
			]),
			new CardData(UsersIcon, 'Players', `${info.Players} / ${info.MaxPlayers} online`, [
				new CardItemData(LogInIcon, 'Joining', info.Joining.toString()),
				new CardItemData(PowerIcon, 'Queued', info.Queued.toString()),
			]),
			new CardData(MonitorCogIcon, 'System', 'Internal server details', [
				new CardItemData(CpuIcon, 'Entity Count', info.EntityCount.toString()),
				new CardItemData(CpuIcon, 'Collections', info.Collections.toString()),
				new CardItemData(CalendareIcon, 'Save Created Time', info.SaveCreatedTime), // format
			]),
			new CardData(MonitorCogIcon, 'Performace', 'Real-time server performace', [
				new CardItemData(GaugeIcon, 'Framerate', `${info.Framerate} FPS`),
				new CardItemData(CpuIcon, 'Memory', info.Memory.toString()), // format
				new CardItemData(NetworkIcon, 'Network In', info.NetworkIn.toString()), // format
				new CardItemData(NetworkIcon, 'Network Out', info.NetworkOut.toString()), // format
			])
		)

		return ret
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
		header: string
		value: string

		constructor(icon: typeof ServerIcon, header: string, value: string) {
			this.icon = icon
			this.header = header
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

<div>
	{#if serverInfo && cardsData}
		{#each cardsData as card, i (i)}
			<Card.Root>
				<Card.Header>
					<Card.Title>
						<card.headerIcon />
						{card.header}
					</Card.Title>
					<Card.Description>{card.description}</Card.Description>
				</Card.Header>
				<Card.Content>
					{#each card.cardItems as cardItem, j (j)}
						<div>
							<cardItem.icon />
							<span>{cardItem.header}</span>
							<span>{cardItem.value}</span>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>
		{/each}
	{/if}
	<span class="font-mono text-sm whitespace-pre">{JSON.stringify(serverInfo, undefined, 2)}</span>
</div>
