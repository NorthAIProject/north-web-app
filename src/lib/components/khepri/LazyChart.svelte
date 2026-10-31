<!--
	A chart whose code arrives when it is about to be seen. The box is rendered
	at the chart's size from the start, so nothing moves when it fills; the
	chart's module (and LayerChart behind it) is imported the first time the box
	comes within 200 px of the viewport. Keeps the charting library out of a
	page's first download when the charts sit below the fold.

	<LazyChart load={() => import('./Bars.svelte')} props={{ days }} class="h-48 min-h-48 w-full" />
-->
<script lang="ts" generics="P extends Record<string, unknown>">
	import type { Component } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		load,
		props,
		class: className = '',
		...rest
	}: { load: () => Promise<{ default: Component<P> }>; props: P; class?: string } & HTMLAttributes<HTMLDivElement> = $props();

	let root: HTMLDivElement | undefined = $state();
	let Loaded = $state.raw<Component<P> | null>(null);

	$effect(() => {
		if (!root || Loaded) return;
		let cancelled = false;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((e) => e.isIntersecting)) return;
				observer.disconnect();
				void load().then((m) => {
					if (!cancelled) Loaded = m.default;
				});
			},
			{ rootMargin: '200px' }
		);
		observer.observe(root);
		return () => {
			cancelled = true;
			observer.disconnect();
		};
	});
</script>

<div bind:this={root} class={className} {...rest}>
	{#if Loaded}
		<Loaded {...props} />
	{/if}
</div>
