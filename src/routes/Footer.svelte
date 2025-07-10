<script lang="ts">
	import { Button } from '$lib/components/ui/button'

	import GithubIcon from '@lucide/svelte/icons/github'

	const currentYear: number = new Date().getFullYear()
</script>

<footer
	class="text-muted-foreground flex flex-col items-center justify-center gap-3 border-t py-8 text-center text-sm"
>
	<div class="flex flex-row flex-wrap items-center justify-center gap-4">
		<Button href="https://github.com/evs-ptr/rust-rcon-web" variant="ghost" size="sm" class="gap-1">
			<GithubIcon class="h-4 w-4" />
			GitHub
		</Button>
	</div>
	<p>© {currentYear} Rust RCon Web. All rights reserved.</p>
</footer>

<style>
	/* No extra styles needed; Tailwind handles layout */
</style>
