<!--
	north-client web/recaps/recaps.templ StripLoader + StripView: the "your
	week" line on My Day. Go rendered an empty placeholder and swapped the strip
	in on load (hx-trigger="load") so the recap's reads never slowed the first
	paint; this does the same with a browser fetch after mount. A failed read
	renders nothing: the strip is a garnish, the page is whole without it.

	Mount it on My Day: <RecapStrip />
-->
<script lang="ts">
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import SmilePlusIcon from '@lucide/svelte/icons/smile-plus';
	import { browserApi } from '#lib/api/client.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { buildStrip, type Strip } from './view.js';

	const i18n = useI18n();
	let strip = $state<Strip | null>(null);
	let settled = $state(false);

	$effect(() => {
		let cancelled = false;
		browserApi()
			.GET('/recap', { params: { query: { range: 'week' } } })
			.then(({ data }) => {
				if (!cancelled && data) strip = buildStrip(data);
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) settled = true;
			});
		return () => {
			cancelled = true;
		};
	});
</script>

{#if strip}
	<a
		href="/app/recap?range=week"
		class="border-hairline bg-surface hover:bg-accent/40 flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors"
		data-testid="recap-strip"
	>
		<div class="shrink-0">
			<SpecChart {...strip.chart} />
		</div>
		<MonoLabel text={i18n.t('recap.strip')} />
		<span class="text-muted-foreground ml-auto flex items-center gap-3 text-sm tabular-nums">
			<span title={i18n.t('recap.tile.active')}>
				<CalendarCheckIcon class="mr-1 inline size-3.5" />
				{strip.activeDays}
			</span>
			<span title={i18n.t('recap.tile.workouts')}>
				<DumbbellIcon class="mr-1 inline size-3.5" />
				{strip.workouts}
			</span>
			<span title={i18n.t('recap.tile.checkins')}>
				<SmilePlusIcon class="mr-1 inline size-3.5" />
				{strip.checkIns}
			</span>
			<ChevronRightIcon class="size-4" />
		</span>
	</a>
{:else if !settled}
	<div class="min-h-14"></div>
{/if}
