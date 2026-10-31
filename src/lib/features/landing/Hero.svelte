<!--
	Full-bleed so the card wall can run edge to edge; its text sits in the same
	column as every other section. Centred: the emblem and motto, a two-line
	headline, the lede and one row of calls to action, with the wall fanned out
	underneath (north-client web/landing/page.templ hero). The store badges live
	in the iPhone section, where the app is the subject.
-->
<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
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
				<!-- The motto in the wordmark's serif, quiet: the emblem carries the brand. -->
				<p class="mt-4 font-display text-lg tracking-[0.03em] text-muted-foreground">
					{i18n.t('land.hero.motto')}
				</p>
				<h1 class="mt-6 font-display text-4xl leading-[1.08] tracking-[-0.01em] text-balance sm:text-5xl lg:text-6xl">
					<span class="block text-balance">{i18n.t('land.hero.h1a')}</span>
					<span class="block text-balance text-muted-foreground">{i18n.t('land.hero.h1b')}</span>
				</h1>
				<p class="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
					{i18n.t('land.hero.lede')}
				</p>
				<div class="mt-9 flex flex-wrap items-center justify-center gap-3">
					<Button href={cta.href} size="lg">
						{cta.label}
						<ArrowRightIcon class="size-4" />
					</Button>
					<Button href="#product-film" size="lg" variant="outline" class="border-hairline">
						{i18n.t('land.hero.see')}
					</Button>
				</div>
				<!-- The tick sits inside the sentence so it stays with the first word when the line centres and wraps. -->
				<p class="mt-4 max-w-sm text-sm text-balance text-muted-foreground">
					<CheckIcon class="mr-1 inline-block size-3.5 -translate-y-px text-signal" aria-hidden="true" />{i18n.t('land.hero.free')}
				</p>
			</div>
		</div>
	</div>
	<HeroWall />
</section>
