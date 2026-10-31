<!--
	One instrument in a KPI strip (north-client ui.KpiCell): the label in plain
	words, the value, and beside it whatever qualifies it (a delta, passed as
	children). An optional note says what the number is of; an optional link
	is where to act on it. On a phone the label sits left and the value right;
	from md they stack.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { KpiCellProps } from './types.js';

	let {
		label,
		value,
		href = '',
		cta = '',
		note = '',
		children
	}: KpiCellProps & { note?: string; children?: Snippet } = $props();
</script>

<div
	class="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5 py-3 md:flex md:flex-col md:items-start md:gap-y-1 md:px-4 md:first:pl-0 md:last:pr-0"
>
	<dt class="text-muted-foreground text-[13px] leading-snug">{label}</dt>
	<dd class="flex items-baseline justify-end gap-2 md:justify-start">
		<span class="text-lg font-medium tabular-nums">{value}</span>
		{@render children?.()}
	</dd>
	{#if note}
		<dd class="text-muted-foreground col-span-2 text-xs leading-snug">{note}</dd>
	{/if}
	{#if href && cta}
		<dd class="col-span-2">
			<a
				{href}
				class="text-signal focus-visible:ring-ring inline-flex min-h-6 items-center rounded-sm text-xs outline-none hover:underline focus-visible:ring-2 pointer-coarse:min-h-11"
			>
				{cta}
			</a>
		</dd>
	{/if}
</div>
