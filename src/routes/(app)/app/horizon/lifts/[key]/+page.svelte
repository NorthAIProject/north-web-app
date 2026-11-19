<!--
	One lift behind its forecast: the logged history, the range ahead, how the
	method has done on this lift before, and what the last form check of it
	said. The load is forecast; how it is moved is not, so the two sit together.
-->
<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import FanChart from '#lib/features/horizon/FanChart.svelte';
	import { fan } from '#lib/features/horizon/fan.js';
	import { weeksAhead } from '#lib/features/horizon/view.js';
	import { localToday } from '#lib/features/progress/view.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();

	const lift = $derived(data.lift);
	const ready = $derived(lift.status === 'ready');
	const today = $derived(localToday(data.user.timezone));
	const chart = $derived(fan(lift.history, ready ? lift.points : [], today));
	const num = (v: number) => i18n.decimal(v, 1);
	const day = (d: string) => formatTime(i18n.locale, d, '2 Jan 2006', 'UTC');
	const latest = $derived(lift.history.at(-1));
	const furthest = $derived(ready ? lift.points.at(-1) : undefined);
	// Newest first: the table is read from the top.
	const logged = $derived(lift.history.toReversed());
	const ahead = $derived(
		ready ? lift.points.filter((p) => p.offsetDays > 0 && p.offsetDays % 7 === 0) : []
	);
	const note = $derived(lift.formNote);
	const confidence = $derived(
		note && i18n.has(`horizon.lift.form.confidence.${note.confidence}`)
			? i18n.t(`horizon.lift.form.confidence.${note.confidence}`)
			: ''
	);
</script>

<svelte:head><title>{pageTitle(lift.name)}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8" data-testid="horizon-lift">
	<header>
		<a href="/app/horizon" class="text-xs text-muted-foreground underline-offset-4 hover:underline"
			>← {i18n.t('horizon.title')}</a
		>
		<div class="mt-3"><MonoLabel text={i18n.t('insights.lifting.col.e1rm')} /></div>
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{lift.name}</h1>
		{#if ready && lift.plateauText}
			<p class="mt-1 text-sm text-muted-foreground">{lift.plateauText}</p>
		{/if}
	</header>

	<section class="rounded-2xl border border-hairline bg-surface p-5">
		{#if latest}
			<p class="text-sm leading-relaxed" data-testid="horizon-lift-summary">
				{i18n.tf('horizon.lift.now', num(latest.value), lift.unit, day(latest.date))}
				{#if furthest && furthest.offsetDays > 0}
					{i18n.tf(
						'horizon.lift.then',
						weeksAhead(furthest.offsetDays) ?? Math.round(furthest.offsetDays / 7),
						num(furthest.low),
						num(furthest.high),
						lift.unit
					)}
				{/if}
			</p>
		{/if}
		{#if !ready}
			<ul class="mt-2 space-y-0.5 text-sm text-muted-foreground" data-testid="horizon-lift-needs">
				{#each lift.needs as need (need.code + need.text)}
					<li>{need.text}</li>
				{/each}
			</ul>
		{/if}
		{#if chart}
			<div class="mt-5"><FanChart {chart} unit={lift.unit} /></div>
		{/if}
		{#if lift.trackRecord}
			<p
				class="mt-4 text-xs text-muted-foreground"
				data-testid="horizon-record"
				data-kind={lift.trackRecord.kind}
			>
				{lift.trackRecord.text}
			</p>
		{/if}
	</section>

	{#if note}
		<section
			class="rounded-2xl border border-hairline bg-surface p-5"
			data-testid="horizon-form-note"
		>
			<div class="flex items-baseline justify-between gap-3">
				<h2 class="text-sm font-medium">{i18n.t('horizon.lift.form.title')}</h2>
				<p class="shrink-0 text-xs text-muted-foreground">{day(note.date)}</p>
			</div>
			<p class="mt-2 text-sm leading-relaxed">{note.summary}</p>
			{#if note.cue}
				<p class="mt-2 text-sm leading-relaxed">
					<span class="text-muted-foreground">{i18n.t('horizon.lift.form.cue')}</span>
					{note.cue}
				</p>
			{/if}
			<p class="mt-3 text-xs text-muted-foreground">
				{#if confidence}{confidence}{/if}
				<a href="/app/form/{note.analysisId}" class="underline underline-offset-4"
					>{i18n.t('horizon.lift.form.open')}</a
				>
			</p>
		</section>
	{/if}

	{#if logged.length > 0 || ahead.length > 0}
		<details
			class="rounded-2xl border border-hairline bg-surface p-5"
			data-testid="horizon-lift-table"
		>
			<summary class="cursor-pointer text-sm font-medium">{i18n.t('horizon.lift.table')}</summary>
			{#if ahead.length > 0}
				<table class="mt-4 w-full text-left text-sm tabular-nums">
					<caption class="mb-2 text-left text-xs text-muted-foreground"
						>{i18n.t('horizon.lift.table.forecast')}</caption
					>
					<thead class="text-xs text-muted-foreground">
						<tr>
							<th scope="col" class="py-1 font-normal">{i18n.t('horizon.lift.col.when')}</th>
							<th scope="col" class="py-1 text-right font-normal"
								>{i18n.t('horizon.lift.col.low')}</th
							>
							<th scope="col" class="py-1 text-right font-normal"
								>{i18n.t('horizon.lift.col.high')}</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-hairline">
						{#each ahead as p (p.offsetDays)}
							<tr>
								<th scope="row" class="py-1 font-normal"
									>{i18n.tf('horizon.scrub.mark', p.offsetDays / 7)}</th
								>
								<td class="py-1 text-right">{num(p.low)}</td>
								<td class="py-1 text-right">{num(p.high)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
			{#if lift.past.length > 0}
				<table class="mt-5 w-full text-left text-sm tabular-nums">
					<caption class="mb-2 text-left text-xs text-muted-foreground"
						>{i18n.t('horizon.lift.table.past')}</caption
					>
					<thead class="text-xs text-muted-foreground">
						<tr>
							<th scope="col" class="py-1 font-normal">{i18n.t('horizon.lift.col.made')}</th>
							<th scope="col" class="py-1 text-right font-normal"
								>{i18n.t('horizon.lift.col.predicted')}</th
							>
							<th scope="col" class="py-1 text-right font-normal"
								>{i18n.t('horizon.lift.col.actual')}</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-hairline">
						{#each lift.past.toReversed() as p (p.madeOn)}
							<tr>
								<th scope="row" class="py-1 font-normal">{day(p.madeOn)}</th>
								<td class="py-1 text-right">{num(p.predicted)}</td>
								<td class="py-1 text-right">{num(p.actual)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
			{#if logged.length > 0}
				<table class="mt-5 w-full text-left text-sm tabular-nums">
					<caption class="mb-2 text-left text-xs text-muted-foreground"
						>{i18n.t('horizon.lift.table.logged')}</caption
					>
					<thead class="text-xs text-muted-foreground">
						<tr>
							<th scope="col" class="py-1 font-normal">{i18n.t('horizon.lift.col.day')}</th>
							<th scope="col" class="py-1 text-right font-normal"
								>{i18n.t('insights.lifting.col.e1rm')} ({lift.unit})</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-hairline">
						{#each logged as p (p.date)}
							<tr>
								<th scope="row" class="py-1 font-normal">{day(p.date)}</th>
								<td class="py-1 text-right">{num(p.value)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</details>
	{/if}
</div>
