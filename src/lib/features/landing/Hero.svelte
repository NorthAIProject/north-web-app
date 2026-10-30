<!--
	Full-bleed so the card wall can run edge to edge; its text sits in the same
	column as every other section. Centred: a two-line headline, the lede, the
	store badges, the web call to action and the pill, with the wall fanned out
	underneath (north-client web/landing/page.templ hero). Since the 2026-10-30
	rebrand it opens with the emblem and motto, and the pill follows the CTAs.
-->
<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import AppButtons from './AppButtons.svelte';
	import HeroWall from './HeroWall.svelte';
	import Waypoint from './Waypoint.svelte';
	import type { Cta } from './cta.js';

	let { cta }: { cta: Cta } = $props();
	const i18n = useI18n();
</script>

<section class="hero relative isolate overflow-hidden">
	<div class="mx-auto w-full max-w-6xl px-6 pt-16 md:pt-24 lg:pl-28 lg:pr-8">
		<div class="relative">
			<Waypoint distance={i18n.t('land.waypoint.day1')} />
			<div class="mx-auto flex max-w-4xl flex-col items-center text-center">
				<!-- The emblem and the motto, as on the brand board: the one place the
				     landing says the name in its own voice. Decorative to a screen
				     reader; the navbar already names the product. -->
				<img
					src="/assets/brand/solar/khepri-emblem-light.svg"
					alt=""
					width="72"
					height="72"
					class="size-16 sm:size-[4.5rem] dark:hidden"
					fetchpriority="high"
				/>
				<img
					src="/assets/brand/solar/khepri-emblem-dark.svg"
					alt=""
					width="72"
					height="72"
					class="hidden size-16 sm:size-[4.5rem] dark:block"
					fetchpriority="high"
				/>
				<p class="mt-5 text-xs font-medium uppercase tracking-[0.32em] text-muted-foreground">
					{i18n.t('land.hero.motto')}
				</p>
				<h1 class="mt-6 font-display text-4xl leading-[1.08] tracking-[-0.01em] sm:text-5xl lg:text-6xl">
					<span class="block text-balance">{i18n.t('land.hero.h1a')}</span>
					<span class="block text-balance text-muted-foreground">{i18n.t('land.hero.h1b')}</span>
				</h1>
				<p class="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
					{i18n.t('land.hero.lede')}
				</p>
				<AppButtons class="mt-9 items-center justify-center" />
				<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
					<Button href={cta.href} size="lg">
						{cta.label}
						<ArrowRightIcon class="size-4" />
					</Button>
					<Button href="#product-film" size="lg" variant="outline" class="border-hairline">
						{i18n.t('land.hero.see')}
					</Button>
				</div>
				<p class="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
					<CheckIcon class="size-3.5 text-signal" />
					{i18n.t('land.hero.free')}
				</p>
				<!-- Hand-rolled rather than Badge: this is a link with its own hover. -->
				<a
					href="#day"
					class="group mt-8 inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-surface/70 py-1 pl-2.5 pr-3 text-xs text-muted-foreground transition-colors hover:border-signal/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
				>
					<span class="size-1.5 shrink-0 rounded-full bg-signal"></span>
					<span class="text-left">{i18n.t('land.hero.badge')}</span>
					<span aria-hidden="true" class="text-muted-foreground/60 transition-transform group-hover:translate-x-0.5">→</span>
				</a>
			</div>
		</div>
	</div>
	<HeroWall />
</section>
