<!-- One instrument in a KPI strip (north-client ui.KpiCell). -->
<script lang="ts">
	import type { KpiCellProps } from './types.js';

	let { label, value, href = '', cta = '' }: KpiCellProps = $props();
</script>

<div class="space-y-1">
	<p class="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.14em]">{label}</p>
	<p class="text-lg font-medium tabular-nums">{value}</p>
	{#if href && cta}
		<a {href} class="text-signal text-xs hover:underline">{cta}</a>
	{/if}
</div>
