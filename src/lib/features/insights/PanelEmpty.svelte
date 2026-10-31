<!--
	north-client web/insights/shell.templ emptyState: what a window with nothing
	in it says. Every panel has one: a chart axis with no series reads as a bug.
-->
<script lang="ts">
	let { message, cta = '', href = '' }: { message: string; cta?: string; href?: string } = $props();
</script>

<div class="py-6 text-center">
	<p class="text-muted-foreground text-sm">{message}</p>
	{#if cta && href}
		<a {href} class="text-signal mt-2 text-sm focus-visible:ring-ring inline-flex min-h-6 items-center rounded-sm outline-none hover:underline focus-visible:ring-2 pointer-coarse:min-h-11">{cta}</a>
	{/if}
</div>
