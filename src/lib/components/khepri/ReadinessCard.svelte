<!--
	The body lit from logged sets: still tired, recovering, trained this week
	(north-client workoutsummary.ReadinessCard).
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import MuscleViewer from './MuscleViewer.svelte';
	import { formatTime } from './dates.js';
	import { staleList } from './workout-summary.js';
	import type { Readiness } from './types.js';

	let {
		readiness,
		timeZone
	}: {
		readiness: Readiness;
		/** IANA zone of the last-session date; the runtime's zone when absent. */
		timeZone?: string;
	} = $props();

	const i18n = useI18n();
</script>

{#snippet legendSwatch(color: string, label: string)}
	<span class="flex items-center gap-1.5">
		<span class={['size-2 rounded-[2px]', color]}></span>
		<span class="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">{label}</span>
	</span>
{/snippet}

<Card class="border-hairline bg-surface" data-testid="muscle-readiness">
	<CardHeader>
		<div class="flex items-baseline justify-between gap-3">
			<CardTitle class="text-base">{i18n.t('layout.readiness.title')}</CardTitle>
			<span class="text-muted-foreground shrink-0 font-mono text-[10px]"
				>{i18n.tf('layout.readiness.last', formatTime(i18n.locale, readiness.lastSession, 'Mon 2 Jan', timeZone))}</span
			>
		</div>
		<CardDescription>{i18n.t('layout.readiness.desc')}</CardDescription>
	</CardHeader>
	<CardContent>
		<MuscleViewer
			id="plan-readiness-viewer"
			primary={readiness.fatigued}
			secondary={readiness.recovering}
			stabilizers={readiness.fresh}
			hideLegend
		/>
		<div class="mt-3 flex flex-wrap items-center gap-3">
			{@render legendSwatch('bg-ember', i18n.t('layout.readiness.fatigued'))}
			{@render legendSwatch('bg-ember/55', i18n.t('layout.readiness.recovering'))}
			{@render legendSwatch('bg-ember/25', i18n.t('layout.readiness.trained'))}
		</div>
		{#if readiness.stale.length > 0}
			<p class="text-muted-foreground mt-3 text-sm">
				<span class="text-foreground font-medium">{i18n.t('layout.readiness.stale')}</span>
				{staleList(i18n, readiness.stale)}
			</p>
		{/if}
	</CardContent>
</Card>
