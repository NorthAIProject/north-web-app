<!-- north-client web/insights/stats.templ tiles: the headline numbers, no trend chip. -->
<script lang="ts">
	import StatTile from '../StatTile.svelte';
	import type { StatsRow } from './types.js';

	let { rows }: { rows: StatsRow[] } = $props();
</script>

<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
	{#each rows as t, i (i)}
		<StatTile label={t.label} value={t.value} note={t.note} />
	{/each}
</div>
