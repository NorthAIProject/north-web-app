<!-- The standard opening of every non-hero section. -->
<script lang="ts">
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';

	let { eyebrow, title, body = '' }: { eyebrow: string; title: string; body?: string } = $props();
</script>

<div class="max-w-2xl">
	<MonoLabel text={eyebrow} />
	<!-- Section titles are a brand moment: the serif, which has one weight. -->
	<h2 class="mt-3 font-display text-3xl tracking-[-0.01em] text-balance md:text-4xl">{title}</h2>
	{#if body}
		<p class="mt-4 text-base leading-relaxed text-muted-foreground">{body}</p>
	{/if}
</div>
