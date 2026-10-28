<!--
	Full-bleed so the card wall can run edge to edge; its text sits in the same
	column as every other section. Centred: the pill, a two-line headline, the
	lede, the store badges and the web call to action, with the wall fanned out
	underneath (north-client web/landing/page.templ hero).
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
	<div
		aria-hidden="true"
		class="pointer-events-none absolute left-1/2 top-0 h-[24rem] w-[42rem] -translate-x-1/2 -translate-y-1/4 rounded-full bg-signal/10 blur-[64px]"
	></div>
	<div class="mx-auto w-full max-w-6xl px-6 pt-16 md:pt-24 lg:pl-28 lg:pr-8">
		<div class="relative">
			<Waypoint distance={i18n.t('land.waypoint.day1')} />
			<div class="mx-auto flex max-w-4xl flex-col items-center text-center">
				<!-- Hand-rolled rather than Badge: this is a link with its own hover. -->
				<a
					href="#day"
					class="group inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-surface/70 py-1 pl-2.5 pr-3 text-xs text-muted-foreground transition-colors hover:border-signal/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
				>
					<span class="size-1.5 shrink-0 rounded-full bg-signal"></span>
					<span class="text-left">{i18n.t('land.hero.badge')}</span>
					<span aria-hidden="true" class="text-muted-foreground/60 transition-transform group-hover:translate-x-0.5">→</span>
				</a>
				<h1 class="mt-7 text-4xl font-bold leading-[1.06] tracking-[-0.025em] sm:text-5xl lg:text-6xl">
					<span class="block text-balance">{i18n.t('land.hero.h1a')}</span>
					<span class="block text-balance text-muted-foreground">{i18n.t('land.hero.h1b')}</span>
				</h1>
				<p class="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
					{i18n.t('land.hero.lede')}
				</p>
				<AppButtons class="mt-9 items-center justify-center" />
				<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
					<Button href={cta.href} size="lg" class="bg-signal text-background hover:bg-signal/90">
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
			</div>
		</div>
	</div>
	<HeroWall />
</section>
