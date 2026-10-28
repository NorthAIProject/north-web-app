<!-- The standard opening of every non-hero section. -->
<script lang="ts">
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';

	let { eyebrow, title, body = '' }: { eyebrow: string; title: string; body?: string } = $props();
</script>

<div class="max-w-2xl">
	<MonoLabel text={eyebrow} />
	<h2 class="mt-3 text-3xl font-medium tracking-[-0.03em] text-balance md:text-4xl">{title}</h2>
	{#if body}
		<p class="mt-4 text-base leading-relaxed text-muted-foreground">{body}</p>
	{/if}
</div>
