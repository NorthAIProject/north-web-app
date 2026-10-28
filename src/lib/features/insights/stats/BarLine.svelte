<!-- north-client web/insights/stats.templ bar: a label, a value, and a bar of pct width. -->
<script lang="ts">
	import type { StatsBar } from './types.js';

	let { bar, color = 'var(--north-signal)' }: { bar: StatsBar; color?: string } = $props();
</script>

<div class="text-sm">
	<div class="flex justify-between gap-2">
		<span>{bar.label}</span>
		<span class="text-muted-foreground tabular-nums">{bar.value}</span>
	</div>
	<div class="bg-muted mt-1 h-1.5 rounded-full">
		<div class="h-1.5 rounded-full" style="width:{bar.pct}%;background:{color}"></div>
	</div>
</div>
