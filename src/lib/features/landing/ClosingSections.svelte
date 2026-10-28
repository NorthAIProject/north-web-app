<!--
	The page's closing run (north-client web/landing/sections.templ): features,
	how it works, the vision, pricing and the final call to action.
-->
<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import BrainIcon from '@lucide/svelte/icons/brain';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CompassIcon from '@lucide/svelte/icons/compass';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import PlugIcon from '@lucide/svelte/icons/plug';
	import TargetIcon from '@lucide/svelte/icons/target';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import AppButtons from './AppButtons.svelte';
	import SectionHeading from './SectionHeading.svelte';
	import Waypoint from './Waypoint.svelte';
	import { planCta, type Cta } from './cta.js';

	let { cta }: { cta: Cta } = $props();
	const i18n = useI18n();
	const t = i18n.t;

	const features = [BrainIcon, TargetIcon, PlugIcon, DumbbellIcon, FileTextIcon];
	// Six columns rather than three: five cards over two rows leaves a hole on a
	// three-column grid, so the last two are widened to close it.
	const featureSpan = (i: number) => (i < 3 ? 'lg:col-span-2' : 'lg:col-span-3');
	const steps = [1, 2, 3, 4];
	const visions = [1, 2, 3];

	const plans = $derived([
		{
			name: t('land.price.free'),
			price: t('land.price.free.amount'),
			period: t('land.price.free.period'),
			blurb: t('land.price.free.blurb'),
			lines: [1, 2, 3, 4, 5, 6].map((n) => t(`land.price.free.${n}`)),
			cta: t('land.price.free.cta'),
			featured: false
		},
		{
			name: t('land.price.pro'),
			price: t('land.price.pro.amount'),
			period: t('land.price.pro.period'),
			blurb: t('land.price.pro.blurb'),
			lines: [1, 2, 3].map((n) => t(`land.price.pro.${n}`)),
			cta: '',
			featured: true
		}
	]);
</script>

<section class="relative border-t border-hairline py-24">
	<Waypoint distance={t('land.waypoint.month8')} />
	<SectionHeading eyebrow={t('land.feat.eyebrow')} title={t('land.feat.title')} />
	<div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
		{#each features as Icon, i (i)}
			<Card.Root class={['border-hairline bg-surface', featureSpan(i)]}>
				<Card.Content>
					<span class="flex size-8 items-center justify-center rounded-md bg-signal/12 text-signal">
						<Icon class="size-4" />
					</span>
					<h3 class="mt-4 text-base font-medium">{t(`land.feat.${i + 1}.name`)}</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`land.feat.${i + 1}.body`)}</p>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</section>

<section class="relative border-t border-hairline py-24">
	<SectionHeading eyebrow={t('land.how.eyebrow')} title={t('land.how.title')} />
	<ol class="mt-10 space-y-0">
		{#each steps as n, i (n)}
			<li class="grid gap-2 py-6 md:grid-cols-[10rem_1fr] md:gap-8">
				<div class="pt-0.5">
					<MonoLabel text={t(`land.how.${n}.when`)} />
				</div>
				<div>
					<h3 class="text-lg font-medium tracking-[-0.02em]">{t(`land.how.${n}.name`)}</h3>
					<p class="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{t(`land.how.${n}.body`)}</p>
				</div>
			</li>
			{#if i < steps.length - 1}
				<Separator class="bg-hairline" />
			{/if}
		{/each}
	</ol>
</section>

<section class="relative border-t border-hairline py-24">
	<Waypoint distance={t('land.waypoint.year2')} />
	<div class="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
		<div>
			<MonoLabel text={t('land.vision.eyebrow')} />
			<blockquote class="mt-5 text-2xl font-medium leading-[1.25] tracking-[-0.025em] text-balance md:text-3xl">
				“{t('land.vision.quote')}”
			</blockquote>
			<p class="mt-6 max-w-[58ch] text-base leading-relaxed text-muted-foreground">
				{t('land.vision.body')}
			</p>
		</div>
		<div class="space-y-4">
			{#each visions as n (n)}
				<div class="rounded-lg border border-hairline bg-surface p-5">
					<div class="font-mono text-xl tracking-tight text-signal">{t(`land.vision.${n}.value`)}</div>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`land.vision.${n}.body`)}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="relative border-t border-hairline py-24">
	<SectionHeading eyebrow={t('land.price.eyebrow')} title={t('land.price.title')} />
	<div class="mt-10 grid gap-5 lg:grid-cols-2">
		{#each plans as plan (plan.name)}
			<Card.Root class={['border-hairline bg-surface', plan.featured && 'ring-1 ring-signal/25']}>
				<Card.Content class="flex h-full flex-col">
					<div class="flex items-center justify-between">
						<MonoLabel text={plan.name} />
						{#if plan.featured}
							<Badge variant="outline" class="border-signal/40 bg-signal/12 text-signal">{t('land.price.pro.badge')}</Badge>
						{/if}
					</div>
					<div class="mt-4 flex items-baseline gap-2">
						<span class="text-4xl font-medium tracking-[-0.03em]">{plan.price}</span>
						<MonoLabel text={plan.period} />
					</div>
					<p class="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.blurb}</p>
					<ul class="mt-6 flex-1 space-y-2.5">
						{#each plan.lines as line (line)}
							<li class="flex items-start gap-2.5 text-sm">
								<CheckIcon class="mt-0.5 size-3.5 shrink-0 text-signal" />
								<span class="text-foreground/90">{line}</span>
							</li>
						{/each}
					</ul>
					<!-- No CTA means the plan cannot be bought; the line keeps the cards the same height. -->
					{#if plan.cta}
						<Button
							href={cta.href}
							variant={plan.featured ? 'default' : 'outline'}
							class={['mt-7 w-full', plan.featured ? 'bg-signal text-background hover:bg-signal/90' : 'border-hairline']}
						>
							{planCta(cta.signedIn, plan.cta, t)}
						</Button>
					{:else}
						<p class="mt-7 rounded-md border border-dashed border-hairline px-4 py-2.5 text-center text-sm text-muted-foreground">
							{t('land.price.pro.nothing')}
						</p>
					{/if}
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
	<p class="mt-6 text-xs text-muted-foreground">
		{t('land.price.footnote')}
	</p>
</section>

<section class="relative border-t border-hairline py-28">
	<div class="mx-auto max-w-2xl text-center">
		<span class="mx-auto flex size-10 items-center justify-center rounded-full bg-signal/12 text-signal">
			<CompassIcon class="size-5" />
		</span>
		<h2 class="mt-7 text-3xl font-medium tracking-[-0.03em] text-balance md:text-4xl">
			{t('land.cta.title')}
		</h2>
		<p class="mx-auto mt-5 max-w-[48ch] text-base leading-relaxed text-muted-foreground">
			{t('land.cta.body')}
		</p>
		<div class="mt-8 flex flex-wrap justify-center gap-3">
			<Button href={cta.href} size="lg" class="bg-signal text-background hover:bg-signal/90">
				{cta.label}
				<ArrowRightIcon class="size-4" />
			</Button>
			{#if !cta.signedIn}
				<Button href="/login" size="lg" variant="outline" class="border-hairline">
					{t('land.cta.signin')}
				</Button>
			{/if}
		</div>
		<AppButtons class="mt-6 items-center justify-center" />
	</div>
</section>
