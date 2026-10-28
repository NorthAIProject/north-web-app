<!--
	north-client web/insights/shell.templ deltaChip: nothing without a previous
	window; direction carried by an arrow as well as a colour.
-->
<script lang="ts">
	import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import { formatPct } from './format.js';
	import type { DeltaView } from './types.js';

	let { delta }: { delta: DeltaView } = $props();
</script>

{#if delta.hasPrior && delta.direction !== 0}
	<span
		class={[
			'inline-flex items-center gap-0.5 font-mono text-[10px] tabular-nums',
			delta.direction > 0 && 'text-signal',
			delta.direction < 0 && 'text-muted-foreground'
		]}
	>
		{#if delta.direction > 0}
			<TrendingUpIcon class="size-3" />
		{:else}
			<TrendingDownIcon class="size-3" />
		{/if}
		{formatPct(delta.pct)}
	</span>
{/if}
