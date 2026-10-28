<script lang="ts">
	import { productName } from '#lib/brand.js';
	import BrandMark from './BrandMark.svelte';

	let {
		href,
		markSize = 'size-6',
		textClass = 'text-base font-medium tracking-tight'
	}: { href: string; markSize?: string; textClass?: string } = $props();
</script>

<a {href} class="inline-flex items-center gap-2">
	<BrandMark size={markSize} />
	<span class={textClass}>{productName}</span>
</a>
