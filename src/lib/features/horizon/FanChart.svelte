<!--
	One lift over time: what was logged as a line up to today, then the
	forecast as a band that widens the further out it looks. The band is the
	point; its middle is drawn faint so nobody reads it as a promise.

	The drawing is hidden from assistive tech: the sentence above it and the
	table below carry every number.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import type { Fan } from './fan.js';

	let { chart, unit }: { chart: Fan; unit: string } = $props();
	const i18n = useI18n();
</script>

<div class="fan" data-testid="horizon-fan" aria-hidden="true">
	<p class="mb-2 w-8 text-right text-[10px] text-muted-foreground">{unit}</p>
	<div class="relative h-56 pl-10">
		{#each chart.yTicks as tick (tick.value)}
			<span
				class="absolute left-0 w-8 -translate-y-1/2 text-right text-[10px] text-muted-foreground tabular-nums"
				style:top="{tick.y}%">{i18n.decimal(tick.value, 0)}</span
			>
		{/each}
		<div class="relative h-full">
			<svg
				class="absolute inset-0 h-full w-full overflow-visible"
				viewBox="0 0 100 100"
				preserveAspectRatio="none"
			>
				{#each chart.yTicks as tick (tick.value)}
					<line x1="0" x2="100" y1={tick.y} y2={tick.y} class="stroke-hairline" />
				{/each}
				<line
					x1={chart.todayX}
					x2={chart.todayX}
					y1="0"
					y2="100"
					class="stroke-muted-foreground/60"
					stroke-dasharray="2 3"
				/>
				{#if chart.band}
					<path d={chart.band} class="fill-foreground/15" data-testid="horizon-fan-band" />
					<path
						d={chart.mid}
						class="stroke-foreground/40"
						fill="none"
						stroke-dasharray="1 4"
						stroke-linecap="round"
					/>
				{/if}
				{#if chart.line}
					<path
						d={chart.line}
						class="stroke-foreground"
						fill="none"
						stroke-width="1.5"
						stroke-linejoin="round"
						stroke-linecap="round"
					/>
				{/if}
			</svg>
		</div>
	</div>
	<div class="relative mt-1.5 ml-10 h-4 text-[10px] text-muted-foreground">
		<span class="absolute -translate-x-1/2" style:left="{chart.todayX}%"
			>{i18n.t('horizon.scrub.today')}</span
		>
		{#each chart.xTicks as tick (tick.weeks)}
			<!-- The last mark sits on the plot's edge: it ends there rather than hang over it. -->
			<span
				class="absolute whitespace-nowrap tabular-nums {tick.x > 95
					? '-translate-x-full'
					: '-translate-x-1/2'}"
				style:left="{tick.x}%">{i18n.tf('horizon.scrub.mark', tick.weeks)}</span
			>
		{/each}
	</div>
</div>

<style>
	.fan :global(svg line),
	.fan :global(svg path) {
		vector-effect: non-scaling-stroke;
	}
</style>
