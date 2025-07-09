<script lang="ts">
	import ServerMain from './ServerMain.svelte'
	import { getServersManagerContext } from './servers-manager.svelte'
	import ServersChooser from './ServersChooser.svelte'

	const serversManager = getServersManagerContext()
</script>

<div>
	<h1>RCON</h1>
	<ServersChooser {serversManager} />
	{#if serversManager.selectedServer}
		<ServerMain server={serversManager.selectedServer} />
	{/if}
</div>
