<!--
	The headline numbers of an insights page (Go statTile row): one ruled
	KpiStrip of label, value and, when there is a previous window, the change.
	The note under a value says what it is of.
-->
<script lang="ts" module>
	import type { DeltaView } from './types.js';

	export type StatItem = { label: string; value: string; note?: string; delta?: DeltaView };
</script>

<script lang="ts">
	import KpiCell from '#lib/components/khepri/KpiCell.svelte';
	import KpiStrip from '#lib/components/khepri/KpiStrip.svelte';
	import DeltaChip from './DeltaChip.svelte';
	import { formatDelta } from './format.js';

	let { items, class: className = '' }: { items: StatItem[]; class?: string } = $props();
</script>

<KpiStrip class={className}>
	{#each items as item, i (i)}
		<KpiCell label={item.label} value={item.value} note={item.note}>
			{#if item.delta}
				<DeltaChip change={formatDelta(item.delta)} />
			{/if}
		</KpiCell>
	{/each}
</KpiStrip>
