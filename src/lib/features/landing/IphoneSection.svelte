<!-- The iPhone app, with the set-entry sheet drawn inside a phone outline (north-client product.templ iphoneSection). -->
<script lang="ts">
	import ChartLineIcon from '@lucide/svelte/icons/chart-line';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import HeartPulseIcon from '@lucide/svelte/icons/heart-pulse';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TimerIcon from '@lucide/svelte/icons/timer';
	import { useI18n } from '#lib/i18n/index.js';
	import AppButtons from './AppButtons.svelte';
	import SectionHeading from './SectionHeading.svelte';

	const i18n = useI18n();
	const t = i18n.t;
	const features = [
		{ n: 1, Icon: DumbbellIcon },
		{ n: 2, Icon: HeartPulseIcon },
		{ n: 3, Icon: TimerIcon },
		{ n: 4, Icon: ChartLineIcon }
	];
</script>

<section id="iphone" class="border-hairline relative scroll-mt-20 border-t py-24">
	<div class="grid items-center gap-12 lg:grid-cols-[1fr_20rem]">
		<div>
			<SectionHeading eyebrow={t('land.iphone.eyebrow')} title={t('land.iphone.title')} body={t('land.iphone.body')} />
			<ul class="mt-8 space-y-4">
				{#each features as f (f.n)}
					<li class="flex gap-3">
						<span class="bg-signal/12 text-signal flex size-8 shrink-0 items-center justify-center rounded-md">
							<f.Icon class="size-4" />
						</span>
						<div>
							<h3 class="text-sm font-medium">{t(`land.iphone.${f.n}.title`)}</h3>
							<p class="text-muted-foreground mt-0.5 text-sm leading-relaxed">{t(`land.iphone.${f.n}.body`)}</p>
						</div>
					</li>
				{/each}
			</ul>
			<AppButtons class="mt-8 items-start" />
		</div>
		<div
			aria-hidden="true"
			class="border-hairline bg-background mx-auto w-full max-w-[18rem] rounded-[2.5rem] border-[6px] p-3 shadow-2xl shadow-black/20"
		>
			<div class="bg-foreground/80 mx-auto mb-4 h-5 w-24 rounded-full"></div>
			<div class="px-2">
				<p class="text-muted-foreground font-mono text-[9px] tracking-[0.14em] uppercase">{t('land.phone.exercise')}</p>
				<p class="mt-2 text-lg font-semibold">{t('land.lift.backsquat')}</p>
				<p class="text-muted-foreground text-xs">{t('land.phone.set')}</p>
			</div>
			<div class="bg-surface border-hairline mt-4 rounded-2xl border p-4">
				<p class="text-muted-foreground text-center text-[10px] font-medium tracking-[0.1em] uppercase">{t('land.phone.weight')}</p>
				<div class="mt-2 flex items-center justify-between">
					<span class="text-signal flex size-8 items-center justify-center rounded-full border border-current">
						<MinusIcon class="size-4" />
					</span>
					<span class="text-3xl font-semibold tabular-nums"
						>{t('land.phone.kg')}<span class="text-muted-foreground text-sm font-normal">kg</span></span
					>
					<span class="text-signal flex size-8 items-center justify-center rounded-full border border-current">
						<PlusIcon class="size-4" />
					</span>
				</div>
				<p class="text-muted-foreground mt-3 text-center text-[11px]">{t('land.phone.last')}</p>
				<div class="border-hairline mt-3 flex items-center justify-between border-t pt-3 text-sm">
					<span>{t('land.phone.reps')}</span>
					<span class="text-muted-foreground">− +</span>
				</div>
			</div>
			<div class="bg-signal text-background mt-4 rounded-xl py-2.5 text-center text-sm font-semibold">{t('land.phone.log')}</div>
			<p class="text-muted-foreground mt-3 mb-2 text-center text-[11px]">{t('land.phone.rest')}</p>
		</div>
	</div>
</section>
