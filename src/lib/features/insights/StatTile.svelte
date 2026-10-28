<!-- north-client web/insights/shell.templ statTile: one headline number, optionally with a trend chip. -->
<script lang="ts">
	import DeltaChip from './DeltaChip.svelte';
	import type { DeltaView } from './types.js';

	let {
		label,
		value,
		note = '',
		delta = { pct: 0, direction: 0, hasPrior: false }
	}: { label: string; value: string; note?: string; delta?: DeltaView } = $props();
</script>

<div class="border-hairline bg-surface/60 space-y-1 rounded-lg border p-4">
	<p class="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.14em]">{label}</p>
	<div class="flex items-baseline gap-2">
		<p class="text-xl font-medium tabular-nums">{value}</p>
		<DeltaChip {delta} />
	</div>
	{#if note}
		<p class="text-muted-foreground text-xs">{note}</p>
	{/if}
</div>
