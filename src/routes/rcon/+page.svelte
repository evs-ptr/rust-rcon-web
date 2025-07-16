<script lang="ts">
	import ServerMain from './ServerMain.svelte'
	import { getServersManagerContext } from './servers-manager.svelte'
	import ServersChooser from './ServersChooser.svelte'

	const serversManager = getServersManagerContext()
</script>

<svelte:head>
	<title>RCon</title>
	<meta
		name="description"
		content="Live RCon console for managing your Rust servers. Connect securely and execute commands in real-time."
	/>
	<link rel="canonical" href="https://rust-rcon-web.evs-ptr.workers.dev/rcon" />

	<meta property="og:url" content="https://rust-rcon-web.evs-ptr.workers.dev/rcon" />
	<meta property="og:title" content="RCon Console | Rust RCon Web" />
	<meta
		property="og:description"
		content="Live RCon console for managing your Rust servers. Connect securely and execute commands in real-time."
	/>

	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://rust-rcon-web.evs-ptr.workers.dev/rcon" />
	<meta property="twitter:title" content="RCon Console | Rust RCon Web" />
	<meta
		property="twitter:description"
		content="Live RCon console for managing your Rust servers. Connect securely and execute commands in real-time."
	/>
</svelte:head>

<div class="flex flex-col gap-4">
	<ServersChooser {serversManager} />
	{#if serversManager.selectedServer}
		<ServerMain server={serversManager.selectedServer} />
	{:else}
		<div class="flex flex-col items-center justify-center gap-4 py-24 text-center text-pretty">
			<h3 class="text-2xl font-bold tracking-tight">No server selected</h3>
			<p class="text-muted-foreground">It's quiet in here... too quiet.</p>
		</div>
	{/if}
</div>
