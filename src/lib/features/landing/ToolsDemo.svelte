<!--
	Quick tools (north-client web/landing/demos.templ toolsDemo, bmiPanel,
	goalSetterPanel + landing.js northBmi / northSetter). Both compute in the
	browser; the server-rendered values are the same defaults Go rendered.
-->
<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CompassIcon from '@lucide/svelte/icons/compass';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import TargetIcon from '@lucide/svelte/icons/target';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import { Slider } from '#lib/components/ui/slider/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import SectionHeading from './SectionHeading.svelte';
	import {
		bmiBand,
		bmiOf,
		bmiText,
		fill,
		setterSplit,
		setterSummary,
		toggleKit,
		type Kit,
		type SetterGoal
	} from './demos.js';
	import type { Cta } from './cta.js';

	let { cta }: { cta: Cta } = $props();

	const i18n = useI18n();
	const t = i18n.t;

	// BMI
	let height = $state(178);
	let weight = $state(82);
	const raw = $derived(bmiOf(height, weight));
	const bmi = $derived(bmiText(raw, t));
	const band = $derived(bmiBand(raw));
	const reading = $derived(fill(t(`land.bmi.read.${band}`), { h: height, w: weight, n: bmi }));

	// Goal setter
	const goals: SetterGoal[] = ['strength', 'leaner', 'endurance', 'pain'];
	// The ⊗ empties the select; the plan keeps to the default goal rather than
	// show Go's blank objective.
	let picked = $state<string>('strength');
	const goal = $derived((picked || 'strength') as SetterGoal);
	let days = $state(3);
	let kit: Kit = $state({ barbell: true, dumbbells: true, pullup: false, none: false });
	const summary = $derived(setterSummary(goal, days, kit, t));
	const split = $derived(setterSplit(goal, days, kit, t));
	const kitKeys = ['barbell', 'dumbbells', 'pullup', 'none'] as const;
</script>

<section class="relative border-t border-hairline py-24">
	<SectionHeading eyebrow={t('land.tools.eyebrow')} title={t('land.tools.title')} body={t('land.tools.body')} />
	<div class="mt-10 grid gap-5 lg:grid-cols-2">
		<div>
			<Card.Root class="h-full border-hairline bg-surface">
				<Card.Content class="flex h-full flex-col">
					<div class="flex items-center gap-2 text-muted-foreground">
						<ScaleIcon class="size-3.5" />
						<MonoLabel text={t('land.bmi.label')} />
					</div>
					<div class="mt-5 space-y-6">
						<div>
							<div class="flex items-baseline justify-between">
								<Label for="bmi-height" class="text-sm">{t('land.bmi.height')}</Label>
								<span class="font-mono text-sm tabular-nums">{height} cm</span>
							</div>
							<Slider id="bmi-height" type="single" min={140} max={210} step={1} bind:value={height} class="mt-3" />
						</div>
						<div>
							<div class="flex items-baseline justify-between">
								<Label for="bmi-weight" class="text-sm">{t('land.bmi.weight')}</Label>
								<span class="font-mono text-sm tabular-nums">{weight} kg</span>
							</div>
							<Slider id="bmi-weight" type="single" min={40} max={160} step={1} bind:value={weight} class="mt-3" />
						</div>
					</div>
					<Separator class="mb-6 mt-auto bg-hairline" />
					<div class="flex items-end justify-between">
						<div>
							<MonoLabel text={t('land.bmi.index')} />
							<div class="mt-1 font-mono text-4xl tabular-nums tracking-tight">{bmi}</div>
						</div>
						<Badge variant="outline" class="border-hairline">
							<span>{t(`land.bmi.band.${band}`)}</span>
						</Badge>
					</div>
					<div class="mt-5 flex items-start gap-2 rounded-md bg-signal/10 p-3">
						<CompassIcon class="mt-0.5 size-3.5 shrink-0 text-signal" />
						<p class="text-xs leading-relaxed text-foreground/90">{reading}</p>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
		<div>
			<Card.Root class="h-full border-hairline bg-surface">
				<Card.Content>
					<div class="flex items-center gap-2 text-muted-foreground">
						<TargetIcon class="size-3.5" />
						<MonoLabel text={t('land.setter.label')} />
					</div>
					<div class="mt-5 space-y-5">
						<div>
							<Label class="text-sm">{t('land.setter.after')}</Label>
							<SearchSelect
								bind:value={picked}
								items={goals.map((g) => ({ value: g, label: t(`land.setter.goal.${g}`) }))}
								placeholder={t('land.setter.pick')}
								search={false}
								class="mt-2 border-hairline bg-background/50"
							/>
						</div>
						<div>
							<div class="flex items-baseline justify-between">
								<Label for="setter-days" class="text-sm">{t('land.setter.days')}</Label>
								<span class="font-mono text-sm tabular-nums">{days}</span>
							</div>
							<Slider id="setter-days" type="single" min={1} max={6} step={1} bind:value={days} class="mt-3" />
						</div>
						<div>
							<Label class="text-sm">{t('land.setter.have')}</Label>
							<div class="mt-3 flex flex-wrap gap-x-5 gap-y-2.5">
								{#each kitKeys as key (key)}
									<div class="flex items-center gap-2">
										<Checkbox
											id="kit-{key}"
											value={key}
											bind:checked={() => kit[key], (checked) => (kit = toggleKit(kit, key, checked))}
										/>
										<Label for="kit-{key}" class="text-sm font-normal">{t(`land.setter.kit.${key}`)}</Label>
									</div>
								{/each}
							</div>
						</div>
					</div>
					<Separator class="my-6 bg-hairline" />
					<div class="rounded-lg border border-hairline bg-background/40 p-4">
						<MonoLabel text={t('land.setter.week')} />
						<p class="mt-2 text-sm leading-relaxed text-foreground/90">{summary}</p>
						<ol class="mt-4 space-y-2">
							{#each split as s, i (i)}
								<li class="flex items-baseline gap-3 text-sm">
									<span class="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">{s.day}</span>
									<span class="text-foreground/90">{s.work}</span>
								</li>
							{/each}
						</ol>
					</div>
					<Button href={cta.href} class="mt-5 w-full bg-signal text-background hover:bg-signal/90">
						{t('land.setter.start')}
						<ArrowRightIcon class="size-4" />
					</Button>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</section>
