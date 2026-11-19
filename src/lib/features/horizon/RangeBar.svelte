<!--
	One forecast number on the day being looked at: a low-to-high bar with a
	soft tick at its middle, never a dot. The track spans everything the
	series is forecast to do, so scrubbing moves and widens the bar; a thin
	mark shows where today's level is, for the eye to measure against.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { barFor, pointAt, reach, weeksAhead, type Series } from './view.js';

	let {
		label,
		series,
		offsetDays,
		note,
		measure,
		children
	}: {
		label: string;
		series: Series;
		offsetDays: number;
		note?: string;
		/** What the number is, when the label alone would mislead: a lift's row is its estimated max, not the bar's weight. */
		measure?: string;
		children?: Snippet;
	} = $props();
	const i18n = useI18n();

	const point = $derived(pointAt(series, offsetDays));
	const bar = $derived(barFor(series, offsetDays));
	const num = (v: number) => i18n.decimal(v, 1);
	const text = $derived(
		!point
			? ''
			: offsetDays === 0
				? `${num(point.mid)} ${series.unit}`
				: `${num(point.low)}–${num(point.high)} ${series.unit}`
	);
</script>

<div class="py-3" data-testid="horizon-row" data-status={series.status}>
	<div class="flex items-baseline justify-between gap-3">
		<p class="min-w-0 truncate text-sm font-medium">
			{label}
			{#if note}<span class="ml-1.5 text-xs font-normal text-muted-foreground">{note}</span>{/if}
		</p>
		{#if series.status === 'ready' && point}
			<p class="shrink-0 text-sm tabular-nums">
				{#if measure}<span class="mr-1.5 text-xs text-muted-foreground">{measure}</span>{/if}<span
					data-testid="horizon-range">{text}</span
				>
			</p>
		{/if}
	</div>

	{#if series.status !== 'ready'}
		<ul class="mt-1 space-y-0.5 text-xs text-muted-foreground">
			{#each series.needs as need (need.code + need.text)}
				<li>{need.text}</li>
			{/each}
		</ul>
	{:else if bar}
		<div class="relative mt-2 h-3" aria-hidden="true">
			<div class="absolute inset-x-0 top-1/2 h-px bg-hairline"></div>
			<div class="absolute top-0 h-3 w-px bg-muted-foreground/60" style:left="{bar.now}%"></div>
			<div
				class="horizon-bar absolute top-0.5 h-2 rounded-full bg-foreground/85"
				style:left="{bar.left}%"
				style:width="{bar.width}%"
			></div>
			{#if offsetDays > 0}
				<div
					class="horizon-bar absolute top-0.5 h-2 w-0.5 -translate-x-1/2 rounded-full bg-background"
					style:left="{bar.mid}%"
				></div>
			{/if}
		</div>
	{:else}
		<p class="mt-1 text-xs text-muted-foreground" data-testid="horizon-out-of-reach">
			{i18n.tf(
				'horizon.row.reach',
				weeksAhead(reach(series)) ?? Math.max(1, Math.round(reach(series) / 7))
			)}
		</p>
	{/if}

	{#if series.trackRecord}
		<p
			class="mt-1.5 text-xs text-muted-foreground"
			data-testid="horizon-record"
			data-kind={series.trackRecord.kind}
		>
			{series.trackRecord.text}
		</p>
	{/if}
	{@render children?.()}
</div>

<style>
	.horizon-bar {
		transition:
			left 180ms ease-out,
			width 180ms ease-out;
	}
	@media (prefers-reduced-motion: reduce) {
		.horizon-bar {
			transition: none;
		}
	}
</style>
