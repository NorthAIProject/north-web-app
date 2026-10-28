<!--
	Rendered markdown (north-client markdown.Render). The HTML comes from
	renderMarkdown(), which escapes raw HTML and unsafe links, so {@html} is
	safe here. Like the Go helper it adds no wrapper styling of its own: wrap
	it in whatever prose container the page uses, or pass class to get one.
-->
<script lang="ts">
	import { renderMarkdown } from './markdown.js';

	let { source, class: className }: { source: string; class?: string } = $props();

	const html = $derived(renderMarkdown(source));
</script>

{#if className}
	<div class={className}>{@html html}</div>
{:else}
	{@html html}
{/if}
