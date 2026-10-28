<!--
	The strip of small gauges (web/day day.templ vitalsStrip). Hand-rolled SVG:
	five 48px arcs do not need a charting engine.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import { arcDash, arcTrack, type Vital } from './view.js';

	let { vitals }: { vitals: Vital[] } = $props();
	const i18n = useI18n();
</script>

<section class="grid grid-cols-5 gap-1.5 sm:gap-2" aria-label={i18n.t('day.vitals')}>
	{#each vitals as v (v.key)}
		<div
			class="border-hairline bg-surface flex min-w-0 flex-col items-center rounded-xl border px-1 py-2 sm:px-2 sm:py-3"
			data-testid="vital-{v.key}"
		>
			<svg viewBox="0 0 48 48" class="size-9 sm:size-12" aria-hidden="true">
				<circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" class="text-hairline" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray={arcTrack()} transform="rotate(135 24 24)"></circle>
				<circle cx="24" cy="24" r="19" fill="none" stroke={v.color} stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray={arcDash(v.fraction)} transform="rotate(135 24 24)"></circle>
			</svg>
			<p class="mt-1 truncate text-sm font-semibold tabular-nums sm:text-base">
				{#if v.value === ''}
					—
				{:else}
					{v.value}
					<span class="text-muted-foreground text-xs font-normal">{v.unit}</span>
				{/if}
			</p>
			<p class="text-muted-foreground max-w-full truncate text-[10px] sm:text-xs">
				{v.label || i18n.t(`day.vital.${v.key}`)}
			</p>
		</div>
	{/each}
</section>
