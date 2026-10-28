<!--
	One passage, and the link that resolves it (Go: web/knowledge resultRow).
	Title, heading trail and line range together; the link opens the lines
	highlighted. Every segment is text, never markup.
-->
<script lang="ts">
	import { headingTrail, hitLines, hitURL } from './format.js';
	import type { KnowledgeHit } from './types.js';

	let { hit }: { hit: KnowledgeHit } = $props();
	const trail = $derived(headingTrail(hit));
</script>

<a href={hitURL(hit)} class="block space-y-1.5 px-3 py-2.5 transition-colors duration-150 hover:bg-muted/50">
	<div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
		<span class="text-sm font-medium">{hit.title}</span>
		{#if trail}
			<span class="text-xs text-muted-foreground">{'› ' + trail}</span>
		{/if}
		<span class="font-mono text-[10px] text-muted-foreground/70 tabular-nums">{hitLines(hit)}</span>
	</div>
	<p class="text-sm leading-relaxed text-muted-foreground">
		{#if hit.segments.length > 0}
			{#each hit.segments as s, i (i)}
				{#if s.matched}<mark class="rounded-sm bg-signal/20 px-0.5 text-foreground">{s.text}</mark>{:else}{s.text}{/if}
			{/each}
		{:else}
			{hit.snippet}
		{/if}
	</p>
</a>
