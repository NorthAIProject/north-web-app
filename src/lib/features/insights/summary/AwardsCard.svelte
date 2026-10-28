<!--
	north-client web/awards/awards.templ SummaryCard, as the insights summary
	shows it below the panels (Go Handler.awardsCard): badges held of the
	catalogue, this month's challenge line, the six most recent coins.
-->
<script lang="ts">
	import Medal from '#lib/components/khepri/Medal.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { Awards } from './types.js';

	let { awards }: { awards: Awards } = $props();

	const i18n = useI18n();

	// awards.Service.Earned is badges only; monthly medals ride along in the
	// API's earned list and are left out here, as Go never counted them.
	const held = $derived(awards.earned.filter((a) => !a.monthly));
	const total = $derived(held.length + awards.locked.filter((a) => !a.monthly).length);
	const recent = $derived(held.slice(-6).reverse());
	const monthly = $derived(awards.monthlyChallenge);
</script>

<Card class="border-hairline bg-surface" id="insights-awards">
	<CardHeader>
		<CardTitle>{i18n.t('awards.card.title')}</CardTitle>
		<CardDescription>{i18n.tf('awards.card.count', held.length, total)}</CardDescription>
	</CardHeader>
	<CardContent>
		{#if monthly}
			<p class="mb-3 text-sm" data-monthly-summary>
				<span class="font-medium">{monthly.title}</span>
				<span class="text-muted-foreground tabular-nums">
					{#if monthly.met}
						· {i18n.t('monthly.met')}
					{:else}
						· {monthly.progressText}
					{/if}
				</span>
			</p>
		{/if}
		{#if recent.length === 0}
			<p class="text-muted-foreground text-sm">{i18n.t('awards.card.empty')}</p>
		{:else}
			<ul class="flex flex-wrap gap-3">
				{#each recent as v (v.id)}
					<li title={v.name}>
						<Medal badgeId={v.id} area={v.area} size={44} label={v.name} />
					</li>
				{/each}
			</ul>
		{/if}
		<div class="mt-3">
			<Button href="/app/awards" variant="ghost" size="sm">{i18n.t('awards.card.all')}</Button>
		</div>
	</CardContent>
</Card>
