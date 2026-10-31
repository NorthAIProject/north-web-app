<!-- north-client web/insights/coach.templ CoachBody. No score ring: talking to the coach is not graded. -->
<script lang="ts">
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { groupedBar } from '#lib/features/viz/chartjs.js';
	import Highlights from '../Highlights.svelte';
	import PanelEmpty from '../PanelEmpty.svelte';
	import StatRow from '../StatRow.svelte';
	import type { CoachView } from './types.js';

	let { view }: { view: CoachView } = $props();
	const i18n = useI18n();
</script>

{#if !view.hasData}
	<PanelEmpty message={i18n.t('insights.coach.empty')} cta={i18n.t('insights.coach.cta')} href="/app/chat" />
{:else}
	<div class="space-y-6" data-testid="insights-coach">
		<StatRow
			items={[
				{ label: i18n.t('insights.coach.turns'), value: String(view.turns), note: i18n.t('insights.coach.turns.note') },
				{ label: i18n.t('insights.coach.yours'), value: String(view.yourMessages) },
				{ label: i18n.t('insights.coach.replies'), value: String(view.coachReplies) },
				view.hasRatings
					? {
							label: i18n.t('insights.coach.useful'),
							value: `${view.helpfulRate}%`,
							note: i18n.tf('insights.coach.useful.rated', view.rated)
						}
					: { label: i18n.t('insights.coach.useful'), value: '—', note: i18n.t('insights.coach.useful.none') }
			]}
		/>
		<div class="border-hairline bg-surface/60 space-y-3 rounded-lg border p-4">
			<MonoLabel text={i18n.t('insights.coach.conversation')} />
			<SpecChart
				{...groupedBar(
					'insights-coach-turns',
					view.chart.labels,
					view.chart.series.map((s) => ({ label: s.label, values: s.values }))
				)}
			/>
		</div>
		{#if view.truncated}
			<p class="text-muted-foreground text-xs">{i18n.t('insights.coach.truncated')}</p>
		{/if}
		{#if view.highlights.length > 0}
			<Highlights lines={view.highlights} />
		{/if}
	</div>
{/if}
