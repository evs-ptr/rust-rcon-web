<script lang="ts">
	import { page } from '$app/state'
</script>

<header>
	<nav>
		<a href="/" class:active={page.url.pathname === '/'}>Home</a>
		<a href="/rcon" class:active={page.url.pathname === '/rcon'}>RCON</a>
	</nav>
</header>

<style>
</style>
