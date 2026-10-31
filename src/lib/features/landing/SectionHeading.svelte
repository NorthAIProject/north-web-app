<!--
	The standard opening of every non-hero section. No eyebrow: the serif title
	opens the section, and the Waypoint distances are the page's only kicker.
-->
<script lang="ts">
	let { title, body = '' }: { title: string; body?: string } = $props();
</script>

<div class="max-w-2xl">
	<!-- Section titles are a brand moment: the serif, which has one weight. -->
	<h2 class="font-display text-3xl tracking-[-0.01em] text-balance md:text-4xl">{title}</h2>
	{#if body}
		<p class="mt-4 text-base leading-relaxed text-muted-foreground">{body}</p>
	{/if}
</div>
