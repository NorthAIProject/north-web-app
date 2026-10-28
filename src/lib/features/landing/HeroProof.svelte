<!--
	What sits under the hero (north-client web/landing/page.templ heroProof +
	product.templ tourLinks): the tour strip, the product film and the
	five-month thread. It opens the content column.
-->
<script lang="ts">
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { useI18n } from '#lib/i18n/index.js';

	const i18n = useI18n();

	const tour = $derived([
		{ href: '#day', label: i18n.t('land.tour.day') },
		{ href: '#patterns', label: i18n.t('land.tour.patterns') },
		{ href: '#coach-builds', label: i18n.t('land.tour.plans') },
		{ href: '#iphone', label: 'iPhone' },
		{ href: '#muscle', label: i18n.t('land.tour.muscle') }
	]);

	// Surface names are product names and stay as they are. Each language names
	// its own mountain in the messages.
	const thread = $derived(
		[
			{ n: 1, surface: 'Web', fromUser: true },
			{ n: 2, surface: 'Web', fromUser: false },
			{ n: 3, surface: 'Telegram', fromUser: true },
			{ n: 4, surface: 'WhatsApp', fromUser: false },
			{ n: 5, surface: 'Discord', fromUser: false }
		].map((e) => ({
			...e,
			date: i18n.t(`land.thread.${e.n}.date`),
			body: i18n.t(`land.thread.${e.n}.body`)
		}))
	);
</script>

<section class="relative pb-24 pt-14">
	<nav aria-label={i18n.t('land.tour.aria')} class="-mx-1 flex flex-wrap gap-2">
		{#each tour as link (link.href)}
			<a
				href={link.href}
				class="border-hairline bg-surface/60 text-muted-foreground hover:text-foreground hover:border-signal/40 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
			>
				{link.label}
			</a>
		{/each}
	</nav>
	<div class="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
		<!-- Muted + playsinline + loop so it autoplays on mobile; the poster covers the first paint. -->
		<div id="product-film" class="scroll-mt-20">
			<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
				<div>
					<MonoLabel text={i18n.t('land.film.label')} />
					<p class="mt-2 max-w-[54ch] text-sm leading-relaxed text-muted-foreground">
						{i18n.t('land.film.desc')}
					</p>
				</div>
				<MonoLabel text={i18n.t('land.film.autoplay')} />
			</div>
			<div
				class="overflow-hidden rounded-xl border border-hairline bg-surface shadow-[0_0_0_1px_color-mix(in_oklab,var(--north-signal)_12%,transparent)]"
			>
				<video
					class="aspect-video w-full bg-background object-cover"
					autoplay
					muted
					loop
					playsinline
					preload="metadata"
					poster="/assets/video/north-hero-poster.webp"
					aria-label={i18n.t('land.film.aria')}
				>
					<source src="/assets/video/north-hero.mp4" type="video/mp4" />
				</video>
			</div>
		</div>
		<div class="rounded-xl border border-hairline bg-surface p-5 md:p-6">
			<div class="flex items-center justify-between pb-5">
				<MonoLabel text={i18n.t('land.thread.one')} />
				<MonoLabel text={i18n.t('land.thread.span')} />
			</div>
			<ol class="space-y-5 border-l border-hairline pl-5">
				{#each thread as t, index (t.n)}
					<!-- Staggered so the thread assembles itself once on load; inert under reduced motion. -->
					<li class="relative motion-safe:animate-thread-in" style:animation-delay="{120 * index}ms">
						<span
							class={[
								'absolute -left-[1.65rem] top-1.5 size-2 rounded-full ring-4 ring-surface',
								t.fromUser && 'bg-muted-foreground/40',
								!t.fromUser && 'bg-agent'
							]}
						></span>
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
							<MonoLabel text={t.date} />
							<span class="text-hairline" aria-hidden="true">·</span>
							<MonoLabel text={t.surface} />
							{#if !t.fromUser}
								<span class="font-mono text-[10px] uppercase tracking-[0.14em] text-agent">Khepri</span>
							{/if}
						</div>
						<p class="mt-1.5 text-sm leading-relaxed text-foreground/90">{t.body}</p>
					</li>
				{/each}
			</ol>
		</div>
	</div>
</section>
