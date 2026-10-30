<script lang="ts">
	import { productName } from '#lib/brand.js';
	import { cn } from '#lib/utils.js';
	import BrandMark from './BrandMark.svelte';

	let {
		href,
		markSize = 'size-6',
		textClass = 'text-base font-medium tracking-tight'
	}: { href: string; markSize?: string; textClass?: string } = $props();
</script>

<a {href} class="inline-flex items-center gap-2">
	<BrandMark size={markSize} />
	<!-- The name is set in the brand serif, as in the wordmark; it has one
	     weight, so callers' weight and tracking classes give way to it. -->
	<span class={cn(textClass, 'font-display font-normal tracking-wide')}>{productName}</span>
</a>
