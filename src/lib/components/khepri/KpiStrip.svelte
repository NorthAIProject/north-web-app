<!--
	The strip KpiCells sit in (north-client ui.KpiStrip): one ruled row of
	label/value pairs, hairlines between them and no tile chrome. On a phone
	it is a list, one pair per line; from md it is a single row.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils.js';

	let { children, class: className = '' }: { children?: Snippet; class?: string } = $props();
</script>

<dl
	class={cn(
		'border-hairline divide-hairline flex flex-col divide-y border-y md:flex-row md:divide-x md:divide-y-0',
		className
	)}
>
	{@render children?.()}
</dl>
