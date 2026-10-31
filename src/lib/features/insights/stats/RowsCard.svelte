<!-- north-client web/insights/stats.templ rowsCard: a titled list of label/value rows. -->
<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import type { StatsRow } from './types.js';

	let {
		title,
		description = '',
		level = 2,
		rows
	}: {
		title: string;
		description?: string;
		/** The card title's heading level: 3 inside a section with its own h2. */
		level?: 2 | 3;
		rows: StatsRow[];
	} = $props();
</script>

<Card class="border-hairline bg-surface">
	<CardHeader>
		<CardTitle {level}>{title}</CardTitle>
		{#if description}
			<CardDescription>{description}</CardDescription>
		{/if}
	</CardHeader>
	<CardContent>
		<dl class="divide-border -my-2 divide-y">
			{#each rows as r, i (i)}
				<div class="flex items-baseline justify-between gap-3 py-2 text-sm">
					<dt class="text-muted-foreground">{r.label}</dt>
					<dd class="text-right font-medium tabular-nums">
						{r.value}
						{#if r.note}
							<span class="text-muted-foreground block text-xs font-normal">{r.note}</span>
						{/if}
					</dd>
				</div>
			{/each}
		</dl>
	</CardContent>
</Card>
