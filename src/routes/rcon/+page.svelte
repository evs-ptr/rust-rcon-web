<script lang="ts">
	import ServerMain from './ServerMain.svelte'
	import { getServersManagerContext } from './servers-manager.svelte'
	import ServersChooser from './ServersChooser.svelte'

	const serversManager = getServersManagerContext()
</script>

<svelte:head>
	<title>RCon</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<ServersChooser {serversManager} />
	{#if serversManager.selectedServer}
		<ServerMain server={serversManager.selectedServer} />
	{/if}
</div>
