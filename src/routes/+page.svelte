<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js'
	import { Separator } from '$lib/components/ui/separator/index.js'
	// Lucide icons
	import ActivityIcon from '@lucide/svelte/icons/activity'
	import Code2Icon from '@lucide/svelte/icons/code-2'
	import GithubIcon from '@lucide/svelte/icons/github'
	import HistoryIcon from '@lucide/svelte/icons/history'
	import LockIcon from '@lucide/svelte/icons/lock'
	import PlugIcon from '@lucide/svelte/icons/plug'
	import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw'
	import ServerIcon from '@lucide/svelte/icons/server'
	import TerminalIcon from '@lucide/svelte/icons/terminal'
</script>

<svelte:head>
	<title>Rust RCon Web – Remote Console for Rust Servers</title>
	<meta
		name="description"
		content="Fast, reliable, browser-based RCon for Rust servers. Connect, execute commands and monitor logs in real-time."
	/>
	<link rel="canonical" href="https://rust-rcon-web.evs-ptr.workers.dev" />

	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://rust-rcon-web.evs-ptr.workers.dev" />
	<meta property="og:title" content="Rust RCon Web – Remote Console for Rust Servers" />
	<meta
		property="og:description"
		content="Fast, reliable, browser-based RCon for Rust servers. Connect, execute commands and monitor logs in real-time."
	/>

	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://rust-rcon-web.evs-ptr.workers.dev" />
	<meta property="twitter:title" content="Rust RCon Web – Remote Console for Rust Servers" />
	<meta
		property="twitter:description"
		content="Fast, reliable, browser-based RCon for Rust servers. Connect, execute commands and monitor logs in real-time."
	/>
</svelte:head>

<section class="flex flex-col items-center gap-6 py-24 text-center">
	<h1
		class="from-foreground via-foreground to-muted-foreground max-w-4xl bg-gradient-to-br bg-clip-text py-2 text-5xl font-extrabold tracking-tight text-balance text-transparent sm:text-6xl"
	>
		Remote console done right.
	</h1>
	<p class="text-muted-foreground max-w-xl text-lg">
		Rust RCon Web connects to your Rust server over WebSocket and gives you a blazing-fast, feature-rich
		console in your browser.
	</p>

	<div class="flex flex-row items-center gap-4">
		<Button href="/rcon" size="lg" class="px-8 py-6 text-lg font-semibold">Open Console</Button>
		<Button href="https://github.com/evs-ptr/rust-rcon-web" variant="ghost" size="lg">
			<GithubIcon class="mr-2 h-5 w-5" />
			View on GitHub
		</Button>
	</div>
</section>

<section class="py-16">
	<h2 class="mb-8 text-center text-3xl font-bold tracking-tight">Everything you need</h2>

	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
		<Card>
			<CardHeader class="flex flex-row items-center gap-2">
				<TerminalIcon class="h-5 w-5" />
				<CardTitle>Live Console</CardTitle>
			</CardHeader>
			<CardContent>See output in real-time with colour-coded log types and automatic scroll.</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center gap-2">
				<HistoryIcon class="h-5 w-5" />
				<CardTitle>Command History</CardTitle>
			</CardHeader>
			<CardContent>Navigate previous commands with ↑ / ↓ and re-execute instantly.</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center gap-2">
				<ServerIcon class="h-5 w-5" />
				<CardTitle>Multi-Server Manager</CardTitle>
			</CardHeader>
			<CardContent>Add, delete and switch between multiple Rust servers effortlessly.</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center gap-2">
				<RefreshCcwIcon class="h-5 w-5" />
				<CardTitle>Resilient Reconnect</CardTitle>
			</CardHeader>
			<CardContent>Automatic exponential back-off reconnection keeps you online.</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center gap-2">
				<LockIcon class="h-5 w-5" />
				<CardTitle>Secure by Default</CardTitle>
			</CardHeader>
			<CardContent>
				Supports <code>wss://</code> and never stores credentials.
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center gap-2">
				<Code2Icon class="h-5 w-5" />
				<CardTitle>Open-source</CardTitle>
			</CardHeader>
			<CardContent>Built with SvelteKit, Tailwind and Bun – MIT licensed.</CardContent>
		</Card>
	</div>
</section>

<section class="py-16">
	<h2 class="mb-12 text-center text-3xl font-bold tracking-tight">How it works</h2>
	<div class="mx-auto grid max-w-3xl gap-8">
		<div class="flex flex-row items-start gap-4">
			<PlugIcon class="h-8 w-8 flex-none" />
			<div>
				<h3 class="font-semibold">Connect</h3>
				<p class="text-muted-foreground">
					Enter your server IP:port and RCon password – optionally use secure WebSocket.
				</p>
			</div>
		</div>
		<Separator />
		<div class="flex flex-row items-start gap-4">
			<ActivityIcon class="h-8 w-8 flex-none" />
			<div>
				<h3 class="font-semibold">Execute commands</h3>
				<p class="text-muted-foreground">Send single commands or stream multiple responses with one click.</p>
			</div>
		</div>
		<Separator />
		<div class="flex flex-row items-start gap-4">
			<TerminalIcon class="h-8 w-8 flex-none" />
			<div>
				<h3 class="font-semibold">Monitor output</h3>
				<p class="text-muted-foreground">
					Live console updates show chat, reports, warnings and errors in real-time.
				</p>
			</div>
		</div>
	</div>
</section>

<section class="py-16">
	<h2 class="mb-8 text-center text-3xl font-bold tracking-tight">Built with modern tech</h2>
	<p class="text-muted-foreground mx-auto max-w-2xl text-center">
		Powered by Svelte v5 runes, Bun, Tailwind v4 and Vitest – delivering instant reloads and a delightful DX.
	</p>
</section>

<section class="bg-muted/40 flex flex-col items-center gap-4 py-16 text-center">
	<h2 class="text-3xl font-bold tracking-tight">Ready to take control?</h2>
	<p class="text-muted-foreground max-w-xl">Spin up Rust RCon Web locally or deploy it anywhere Bun runs.</p>
	<Button href="/rcon" size="lg" class="px-10 py-6 text-lg font-semibold">Open Console Now</Button>
</section>

<style>
</style>
