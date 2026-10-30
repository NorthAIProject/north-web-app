<!--
	The shared first-run block (north-client ui.Empty). A blank list is not an
	empty page — it is an invitation to do the one next thing. The CTA is the
	children snippet: a link, a form, or a button.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Mascot from './Mascot.svelte';
	import MonoLabel from './MonoLabel.svelte';
	import type { EmptyStateProps } from './types.js';

	let {
		eyebrow = '',
		title,
		body = '',
		mascot = false,
		class: className = '',
		children
	}: EmptyStateProps & { children?: Snippet } = $props();
</script>

<div class={['flex flex-col items-center py-12 text-center', className]}>
	{#if mascot}
		<Mascot size="md" class="mb-4" />
	{/if}
	{#if eyebrow}
		<MonoLabel text={eyebrow} />
	{/if}
	<h2 class="mt-2 text-lg font-medium tracking-tight">{title}</h2>
	{#if body}
		<p class="text-muted-foreground mt-1 max-w-sm text-sm leading-relaxed">{body}</p>
	{/if}
	<div class="mt-4 flex flex-wrap items-center justify-center gap-2">
		{@render children?.()}
	</div>
</div>
