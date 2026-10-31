<!--
	The page's closing run (north-client web/landing/sections.templ): features,
	how it works, the vision, pricing and the final call to action.
-->
<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import SectionHeading from './SectionHeading.svelte';
	import Waypoint from './Waypoint.svelte';
	import { planCta, type Cta } from './cta.js';

	let { cta }: { cta: Cta } = $props();
	const i18n = useI18n();
	const t = i18n.t;

	const features = [1, 2, 3, 4, 5];
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
	<SectionHeading title={t('land.feat.title')} />
	<!-- A definition list, not a card grid: the demos above already show these;
	     this is the plain inventory, read top to bottom. -->
	<dl class="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
		{#each features as n (n)}
			<div class="border-t border-hairline pt-5">
				<dt class="text-base font-medium text-balance">{t(`land.feat.${n}.name`)}</dt>
				<dd class="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{t(`land.feat.${n}.body`)}</dd>
			</div>
		{/each}
	</dl>
</section>

<section class="relative border-t border-hairline py-24">
	<SectionHeading title={t('land.how.title')} />
	<ol class="mt-10 divide-y divide-hairline">
		{#each steps as n (n)}
			<li class="grid gap-2 py-6 md:grid-cols-[10rem_1fr] md:gap-8">
				<p class="pt-0.5 text-sm text-muted-foreground tabular-nums">{t(`land.how.${n}.when`)}</p>
				<div>
					<h3 class="text-lg font-medium tracking-[-0.02em] text-balance">{t(`land.how.${n}.name`)}</h3>
					<p class="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{t(`land.how.${n}.body`)}</p>
				</div>
			</li>
		{/each}
	</ol>
</section>

<section class="relative border-t border-hairline py-24">
	<Waypoint distance={t('land.waypoint.year2')} />
	<div class="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
		<div>
			<!-- Named for the outline; the quote opens the section on screen. -->
			<h2 class="sr-only">{t('land.vision.eyebrow')}</h2>
			<blockquote class="text-2xl font-medium leading-[1.25] tracking-[-0.025em] text-balance md:text-3xl">
				“{t('land.vision.quote')}”
			</blockquote>
			<p class="mt-6 max-w-[58ch] text-base leading-relaxed text-muted-foreground">
				{t('land.vision.body')}
			</p>
		</div>
		<!-- Three terms and what they mean here, set as text rather than as metric tiles. -->
		<dl class="divide-y divide-hairline self-start border-y border-hairline">
			{#each visions as n (n)}
				<div class="py-4">
					<dt class="text-base font-medium">{t(`land.vision.${n}.value`)}</dt>
					<dd class="mt-1 text-sm leading-relaxed text-muted-foreground">{t(`land.vision.${n}.body`)}</dd>
				</div>
			{/each}
		</dl>
	</div>
</section>

<section class="relative border-t border-hairline py-24">
	<SectionHeading title={t('land.price.title')} />
	<div class="mt-10 grid gap-5 lg:grid-cols-2">
		{#each plans as plan (plan.name)}
			<Card.Root class={['border-hairline bg-surface', plan.featured && 'ring-1 ring-signal/25']}>
				<Card.Content class="flex h-full flex-col">
					<div class="flex items-center justify-between">
						<h3 class="text-base font-medium">{plan.name}</h3>
						{#if plan.featured}
							<Badge variant="outline" class="border-signal/40 bg-signal/12 text-signal-text">{t('land.price.pro.badge')}</Badge>
						{/if}
					</div>
					<div class="mt-4 flex items-baseline gap-2">
						<span class="text-4xl font-medium tracking-[-0.03em]">{plan.price}</span>
						<span class="text-sm text-muted-foreground">{plan.period}</span>
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
							class={['mt-7 w-full', !plan.featured && 'border-hairline']}
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

<!-- The last word sits in the content column like every other section: the
     headline, one sentence, one row of buttons. The store badges are in the
     iPhone section. -->
<section class="relative border-t border-hairline py-28">
	<div class="max-w-2xl">
		<h2 class="font-display text-3xl tracking-[-0.01em] text-balance md:text-4xl">
			{t('land.cta.title')}
		</h2>
		<p class="mt-5 max-w-[48ch] text-base leading-relaxed text-muted-foreground">
			{t('land.cta.body')}
		</p>
		<div class="mt-8 flex flex-wrap gap-3">
			<Button href={cta.href} size="lg">
				{cta.label}
				<ArrowRightIcon class="size-4" />
			</Button>
			{#if !cta.signedIn}
				<Button href="/login" size="lg" variant="outline" class="border-hairline">
					{t('land.cta.signin')}
				</Button>
			{/if}
		</div>
	</div>
</section>
