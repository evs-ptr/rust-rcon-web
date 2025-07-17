<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js'
	import CalendareIcon from '@lucide/svelte/icons/calendar'
	import ClockIcon from '@lucide/svelte/icons/clock'
	import MapIcon from '@lucide/svelte/icons/map'
	import ServerIcon from '@lucide/svelte/icons/server'
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
