<script lang="ts">
	interface Props {
		server: RustServer
	}

	let { server }: Props = $props()
</script>

<div>
	{server}
</div>
