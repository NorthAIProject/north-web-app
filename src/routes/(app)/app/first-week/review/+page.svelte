<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Card, CardContent } from '#lib/components/ui/card/index.js';
	import Dots from '#lib/features/firstweek/Dots.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
	const w = $derived(data.week);
	const days = $derived(w.days.map((d) => d.done));

	// "What next?": the rest of Khepri the first week kept folded away.
	const nexts = [
		{ key: 'firstweek.review.next.habits', href: '/app/care', testId: 'first-week-next-habits' },
		{ key: 'firstweek.review.next.training', href: '/app/training/plans', testId: 'first-week-next-training' },
		{ key: 'firstweek.review.next.crews', href: '/app/crews', testId: 'first-week-next-crews' }
	];
</script>

<svelte:head><title>{pageTitle(i18n.t('firstweek.review.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8" data-testid="first-week-review">
	<header>
		<MonoLabel text={i18n.t(`firstweek.${w.template}.label`)} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('firstweek.review.title')}</h1>
		<p class="text-muted-foreground mt-1 flex items-center gap-3 text-sm">
			<Dots {days} today={days.length + 1} />
			{i18n.tf('firstweek.card.progress', w.review?.daysDone ?? w.doneCount)}
		</p>
	</header>
	<Card class="border-hairline bg-surface">
		<CardContent class="pt-6">
			<p class="text-sm leading-relaxed whitespace-pre-line" data-testid="first-week-review-text">{w.review?.text ?? ''}</p>
		</CardContent>
	</Card>
	<section class="space-y-3">
		<h2 class="text-lg font-medium tracking-tight">{i18n.t('firstweek.review.next')}</h2>
		<p class="text-muted-foreground text-sm">{i18n.t('firstweek.review.next.intro')}</p>
		<div class="flex flex-wrap gap-2">
			{#each nexts as n (n.href)}
				<Button href={n.href} variant="outline" size="sm" data-testid={n.testId}>{i18n.t(n.key)}</Button>
			{/each}
		</div>
	</section>
</div>
