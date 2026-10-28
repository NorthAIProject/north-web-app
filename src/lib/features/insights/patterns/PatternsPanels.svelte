<!-- north-client web/insights/stats.templ PatternsPanels. -->
<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import BarLine from '../stats/BarLine.svelte';
	import StatsEmpty from '../stats/StatsEmpty.svelte';
	import type { PatternsView } from '../stats/types.js';

	let { view }: { view: PatternsView } = $props();
	const i18n = useI18n();
</script>

<div class="space-y-4" data-testid="insights-patterns">
	<p class="text-muted-foreground max-w-2xl text-sm leading-relaxed">
		{i18n.tf('insights.patterns.intro', view.days)}
	</p>
	{#if view.findings.length === 0}
		<StatsEmpty message={i18n.t('insights.patterns.empty')} />
	{/if}
	<div class="grid gap-4 md:grid-cols-2">
		{#each view.findings as f, i (i)}
			<Card class="border-hairline bg-surface">
				<CardHeader>
					<CardTitle>{f.title}</CardTitle>
					<CardDescription>{f.detail}</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						<BarLine bar={f.a} color="var(--north-signal)" />
						<BarLine bar={f.b} color="var(--muted-foreground)" />
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>
</div>
