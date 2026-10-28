<!--
	The plan's days this week, each done or still open, with the count as a
	sentence and a bar (north-client workoutsummary.WeekStrip). Build `week`
	with newWeek() from workout-summary.ts.
-->
<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Circle from '@lucide/svelte/icons/circle';
	import { useI18n } from '#lib/i18n/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import { formatTime } from './dates.js';
	import { weekDayLabel } from './workout-summary.js';
	import type { Week } from './types.js';

	let { week }: { week: Week } = $props();

	const i18n = useI18n();
</script>

<div class="space-y-3" data-testid="plan-week">
	<div class="flex items-baseline justify-between gap-3">
		<p class="text-sm font-medium">{week.sentence}</p>
		<span class="text-muted-foreground shrink-0 font-mono text-[10px] tabular-nums">{week.done}/{week.planned}</span>
	</div>
	<Progress max={week.planned} value={week.done} size="sm" barClass="bg-signal" />
	<ol class="flex flex-wrap gap-2">
		{#each week.days as d, i (i)}
			<li
				class={[
					'flex min-w-[4.5rem] flex-1 flex-col rounded-lg border px-2.5 py-2',
					d.done && 'border-signal/40 bg-signal/10',
					!d.done && 'border-hairline',
					d.today && !d.done && 'ring-signal/50 ring-1'
				]}
				aria-label={weekDayLabel(i18n, d)}
			>
				<span class="flex items-center justify-between gap-1 font-mono text-[10px] uppercase tracking-[0.1em]">
					{formatTime(i18n.locale, d.date, 'Mon')}
					{#if d.done}
						<CircleCheck class="text-signal size-3.5" />
					{:else if d.past}
						<Circle class="text-muted-foreground size-3.5" />
					{/if}
				</span>
				{#if d.focus}
					<span class="text-muted-foreground mt-0.5 truncate text-xs">{d.focus}</span>
				{/if}
			</li>
		{/each}
	</ol>
</div>
