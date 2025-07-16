<script lang="ts">
	import { page } from '$app/state'
	import { buttonVariants } from '$lib/components/ui/button'
</script>

<div class="flex h-full w-full flex-col items-center justify-center text-center">
	<h1 class="text-foreground text-9xl font-bold">{page.status}</h1>
	<p class="text-muted-foreground mb-8 text-2xl">
		{page.status === 404 ? "Oops! The page you're looking for is lost in space." : page.error?.message}
	</p>
	<a href="/" class={buttonVariants({ size: 'lg' })}>Go Home</a>
</div>

