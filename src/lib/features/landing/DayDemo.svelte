<!--
	What a day looks like inside Khepri, drawn as a static mock-up of the real
	screen (north-client web/landing/product.templ dayDemo). Static on purpose —
	no data, no script — so it renders instantly and never shows a visitor
	someone else's numbers.
-->
<script lang="ts">
	import CoffeeIcon from '@lucide/svelte/icons/coffee';
	import DropletIcon from '@lucide/svelte/icons/droplet';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import HeartPulseIcon from '@lucide/svelte/icons/heart-pulse';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import PersonStandingIcon from '@lucide/svelte/icons/person-standing';
	import PillIcon from '@lucide/svelte/icons/pill';
	import UtensilsIcon from '@lucide/svelte/icons/utensils';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import SectionHeading from './SectionHeading.svelte';

	const i18n = useI18n();
	const t = i18n.t;

	// Titles and details are copy; amounts that read the same in every language stay literal.
	const day = $derived([
		{ time: '21:10', title: t('land.day.mock.1.title'), detail: t('land.day.mock.1.detail'), color: 'var(--color-day-protein)', Icon: PillIcon },
		{ time: '19:40', title: t('land.day.mock.2.title'), detail: t('land.day.mock.2.detail'), color: 'var(--color-day-food)', Icon: UtensilsIcon },
		{ time: '18:05', title: t('land.day.mock.3.title'), detail: t('land.day.mock.3.detail'), color: 'var(--color-day-fat)', Icon: DumbbellIcon },
		{ time: '13:10', title: t('land.day.mock.4.title'), detail: '500 ml', color: 'var(--color-day-water)', Icon: DropletIcon },
		{ time: '12:30', title: t('land.day.mock.5.title'), detail: '650 kcal', color: 'var(--color-day-food)', Icon: UtensilsIcon },
		{ time: '10:05', title: t('land.day.mock.6.title'), detail: t('land.day.mock.6.detail'), color: 'var(--color-day-caffeine)', Icon: CoffeeIcon },
		{ time: '07:10', title: t('land.day.mock.7.title'), detail: t('land.day.mock.7.detail'), color: 'var(--color-day-sleep)', Icon: MoonIcon }
	]);

	const gauges = $derived([
		{ value: '72', unit: 'mg', label: t('land.day.gauge.caffeine'), color: 'var(--color-day-caffeine)', pct: 18 },
		{ value: '68', unit: '%', label: t('land.day.gauge.energy'), color: 'var(--color-day-move)', pct: 68 },
		{ value: '84', unit: 'min', label: t('land.day.gauge.sun'), color: 'var(--color-day-sun)', pct: 84 },
		{ value: '3h 12m', unit: '', label: t('land.day.gauge.screen'), color: 'var(--color-day-screen)', pct: 53 }
	]);

	const facts = $derived([
		{ Icon: LayersIcon, title: t('land.day.fact.1.title'), body: t('land.day.fact.1.body') },
		{ Icon: HeartPulseIcon, title: t('land.day.fact.2.title'), body: t('land.day.fact.2.body') },
		{ Icon: PersonStandingIcon, title: t('land.day.fact.3.title'), body: t('land.day.fact.3.body') }
	]);
</script>

<section id="day" class="border-hairline relative scroll-mt-20 border-t py-24">
	<SectionHeading eyebrow={t('land.day.eyebrow')} title={t('land.day.title')} body={t('land.day.body')} />
	<div class="mt-10 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
		<Card.Root class="border-hairline bg-surface overflow-hidden">
			<Card.Content class="relative space-y-2 py-5">
				<div
					aria-hidden="true"
					class="absolute inset-y-4 left-[4.6rem] border-l-2 border-dashed border-[var(--color-day-fat)] opacity-60"
				></div>
				<p class="text-day-fat relative mb-1 pl-16 text-[10px] font-medium">{t('land.day.fasting')}</p>
				{#each day as e (e.time)}
					<div class="relative flex items-center gap-3">
						<span class="text-muted-foreground w-10 shrink-0 text-right text-[11px] tabular-nums">{e.time}</span>
						<div
							class="ml-3 flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[color-mix(in_oklch,var(--mock)_22%,transparent)] bg-[color-mix(in_oklch,var(--mock)_11%,var(--color-surface))] px-3 py-1.5"
							style:--mock={e.color}
						>
							<span class="shrink-0 text-[var(--mock)]">
								<e.Icon class="size-4" />
							</span>
							<span class="min-w-0 leading-tight">
								<span class="block truncate text-sm font-medium">{e.title}</span>
								<span class="text-muted-foreground block truncate text-[11px]">{e.detail}</span>
							</span>
						</div>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
		<div class="space-y-6">
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{#each gauges as g (g.label)}
					<div class="border-hairline bg-surface rounded-2xl border p-4 text-center">
						<svg viewBox="0 0 100 60" class="mx-auto h-12 w-20" aria-hidden="true">
							<path d="M10 55 A40 40 0 0 1 90 55" fill="none" stroke="var(--color-hairline)" stroke-width="9" stroke-linecap="round"></path>
							<path
								d="M10 55 A40 40 0 0 1 90 55"
								fill="none"
								stroke={g.color}
								stroke-width="9"
								stroke-linecap="round"
								pathLength="100"
								stroke-dasharray="{g.pct} 100"
							></path>
						</svg>
						<p class="mt-1 text-lg font-semibold tabular-nums">
							{g.value}
							{#if g.unit}
								<span class="text-muted-foreground text-xs font-normal">{g.unit}</span>
							{/if}
						</p>
						<p class="text-muted-foreground text-xs">{g.label}</p>
					</div>
				{/each}
			</div>
			<div class="grid gap-3 sm:grid-cols-3">
				{#each facts as f (f.title)}
					<div class="border-hairline bg-surface rounded-xl border p-4">
						<span class="bg-signal/12 text-signal flex size-8 items-center justify-center rounded-md">
							<f.Icon class="size-4" />
						</span>
						<h3 class="mt-3 text-sm font-medium">{f.title}</h3>
						<p class="text-muted-foreground mt-1 text-xs leading-relaxed">{f.body}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
