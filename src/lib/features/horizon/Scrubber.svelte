<!--
	The day being looked at, today to twelve weeks on. A native range input,
	so arrows, Home/End and a screen reader all work as they do everywhere
	else; the steps are the forecast's own days (daily for a fortnight, then
	weekly), so there is no position between two frames to land on.
-->
<script lang="ts">
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { weeksAhead, type Frame } from './view.js';

	let { frames, index = $bindable(0) }: { frames: Frame[]; index: number } = $props();
	const i18n = useI18n();

	const frame = $derived(frames[index]);
	const last = $derived(frames.length - 1);
	const day = (date: string) => formatTime(i18n.locale, date, '2 January', 'UTC');

	function label(f: Frame | undefined): string {
		if (!f || f.offsetDays === 0) return i18n.t('horizon.scrub.today');
		const weeks = weeksAhead(f.offsetDays);
		return weeks
			? i18n.tf('horizon.scrub.weeks', weeks, day(f.date))
			: i18n.tf('horizon.scrub.days', f.offsetDays, day(f.date));
	}

	// Week marks under the track: where the daily steps end and each
	// fourth week after.
	const marks = $derived(
		frames
			.map((f, i) => ({ i, weeks: weeksAhead(f.offsetDays) }))
			// Two and six weeks: the first fortnight is a step a day and the rest a
			// step a week, so marks any closer together would overprint.
			.filter((m) => m.weeks === 2 || m.weeks === 6)
	);
</script>

<div data-testid="horizon-scrubber">
	<div class="flex items-baseline justify-between gap-3">
		<p class="text-lg font-medium tracking-tight" aria-hidden="true" data-testid="horizon-when">
			{label(frame)}
		</p>
		{#if index > 0}
			<button
				type="button"
				class="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
				onclick={() => (index = 0)}
			>
				{i18n.t('horizon.scrub.reset')}
			</button>
		{/if}
	</div>
	<input
		type="range"
		class="horizon-range mt-3 w-full"
		min="0"
		max={last}
		step="1"
		bind:value={index}
		aria-label={i18n.t('horizon.scrub.label')}
		aria-valuetext={label(frame)}
		style:--fill="{last > 0 ? (index / last) * 100 : 0}%"
	/>
	<div class="relative mt-1 h-4 text-[10px] text-muted-foreground tabular-nums" aria-hidden="true">
		<span class="absolute left-0">{i18n.t('horizon.scrub.today')}</span>
		{#each marks as m (m.i)}
			{#if m.i < last}
				<span class="absolute -translate-x-1/2" style:left="{(m.i / last) * 100}%"
					>{i18n.tf('horizon.scrub.mark', m.weeks)}</span
				>
			{/if}
		{/each}
		<span class="absolute right-0"
			>{i18n.tf('horizon.scrub.mark', weeksAhead(frames[last]?.offsetDays ?? 0) ?? 0)}</span
		>
	</div>
</div>

<style>
	/* The one gold thing on the page: where in time you are looking. */
	.horizon-range {
		appearance: none;
		height: 28px;
		background: transparent;
		cursor: pointer;
	}
	.horizon-range::-webkit-slider-runnable-track {
		height: 4px;
		border-radius: 2px;
		background: linear-gradient(
			to right,
			var(--color-signal) var(--fill),
			var(--color-hairline) var(--fill)
		);
	}
	.horizon-range::-moz-range-track {
		height: 4px;
		border-radius: 2px;
		background: var(--color-hairline);
	}
	.horizon-range::-moz-range-progress {
		height: 4px;
		border-radius: 2px;
		background: var(--color-signal);
	}
	.horizon-range::-webkit-slider-thumb {
		appearance: none;
		width: 20px;
		height: 20px;
		margin-top: -8px;
		border-radius: 9999px;
		background: var(--color-signal);
		border: 3px solid var(--color-background);
		box-shadow: 0 0 0 1px var(--color-signal);
	}
	.horizon-range::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 9999px;
		background: var(--color-signal);
		border: 3px solid var(--color-background);
		box-shadow: 0 0 0 1px var(--color-signal);
	}
	.horizon-range:focus-visible {
		outline: none;
	}
	.horizon-range:focus-visible::-webkit-slider-thumb {
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-signal) 40%, transparent);
	}
	.horizon-range:focus-visible::-moz-range-thumb {
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-signal) 40%, transparent);
	}
</style>
