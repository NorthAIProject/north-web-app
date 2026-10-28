<!-- north-client web/insights/stats.templ barsCard: a titled stack of bars. -->
<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import BarLine from './BarLine.svelte';
	import type { StatsBar } from './types.js';

	let { title, description = '', bars }: { title: string; description?: string; bars: StatsBar[] } = $props();
</script>

<Card class="border-hairline bg-surface">
	<CardHeader>
		<CardTitle>{title}</CardTitle>
		{#if description}
			<CardDescription>{description}</CardDescription>
		{/if}
	</CardHeader>
	<CardContent>
		<div class="space-y-3">
			{#each bars as b, i (i)}
				<BarLine bar={b} />
			{/each}
		</div>
	</CardContent>
</Card>
