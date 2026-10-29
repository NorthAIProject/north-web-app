<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import KpiCell from '#lib/components/khepri/KpiCell.svelte';
	import KpiStrip from '#lib/components/khepri/KpiStrip.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import DictateField from '#lib/features/checkins/DictateField.svelte';
	import MoodEnergyChart from '#lib/features/checkins/MoodEnergyChart.svelte';
	import { avgKPI, instrumentsFor } from '#lib/features/checkins/checkins.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();
	const timeZone = $derived(data.user.timezone || 'UTC');
	const inst = $derived(instrumentsFor(data.recent, timeZone));
	const errors = $derived<Record<string, string>>(form?.errors ?? {});

	// A rejected entry keeps what was written (Go JournalForm).
	// svelte-ignore state_referenced_locally
	let mood = $state(form?.values?.mood != null ? String(form.values.mood) : '');
	const moodItems = $derived([
		{ value: '', label: i18n.t('mind.form.no_rating') },
		...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}/5` }))
	]);
	let submitting = $state(false);

	const countKPI = $derived(inst.count <= 0 ? '—' : i18n.tf('mind.kpi.checkins.value', inst.count));
</script>

<svelte:head><title>{pageTitle(i18n.t('mind.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('mind.title')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('mind.heading')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('mind.intro')}</p>
	</header>
	<KpiStrip>
		<KpiCell
			label={i18n.t('mind.kpi.mood')}
			value={avgKPI(i18n, inst.avgMood, inst.count)}
			href="/app/check-ins"
			cta={i18n.t('mind.check_in')}
		/>
		<KpiCell
			label={i18n.t('mind.kpi.energy')}
			value={avgKPI(i18n, inst.avgEnergy, inst.count)}
			href="/app/check-ins"
			cta={i18n.t('mind.check_in')}
		/>
		<KpiCell label={i18n.t('mind.kpi.checkins')} value={countKPI} href="/app/check-ins" cta={i18n.t('mind.view')} />
	</KpiStrip>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('mind.chart.title')}</Card.Title>
			<Card.Description>{i18n.t('mind.chart.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if inst.hasData}
				<MoodEnergyChart id="mind-mood-energy" days={inst.days} />
			{:else}
				<p class="text-muted-foreground mb-4 text-sm">{i18n.t('mind.chart.empty')}</p>
				<Button href="/app/check-ins" class="bg-signal text-background hover:bg-signal/90">{i18n.t('mind.check_in')}</Button>
			{/if}
		</Card.Content>
	</Card.Root>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('mind.form.title')}</Card.Title>
			<Card.Description>{i18n.t('mind.form.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="post"
				action="?/journal"
				class="space-y-4"
				use:enhance={({ formElement }) => {
					submitting = true;
					return async ({ result, update }) => {
						await update({ reset: false });
						submitting = false;
						// Saved: start a blank entry, as Go's redirect does.
						if (result.type === 'redirect') {
							formElement.reset();
							mood = '';
						}
					};
				}}
			>
				<div class="space-y-2">
					<Label for="content">{i18n.t('mind.form.reflection')}</Label>
					<DictateField target="content">
						<Textarea
							id="content"
							name="content"
							rows={4}
							placeholder={i18n.t('mind.form.ph')}
							value={form?.values?.content ?? ''}
							aria-invalid={errors.content ? 'true' : undefined}
						/>
					</DictateField>
					{#if errors.content}
						<p class="text-[0.8rem] font-medium text-red-500">{errors.content}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<Label for="mood">{i18n.t('mind.form.mood')}</Label>
					<SearchSelect id="mood" name="mood" bind:value={mood} items={moodItems} placeholder={i18n.t('mind.form.no_rating')} />
					{#if errors.mood}
						<p class="text-[0.8rem] font-medium text-red-500">{errors.mood}</p>
					{/if}
				</div>
				<Button type="submit" class="bg-signal text-background hover:bg-signal/90" disabled={submitting}>
					{i18n.t('mind.form.save')}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
	{#if data.entries.length > 0}
		<section class="space-y-3">
			<h2 class="text-sm font-medium">{i18n.t('mind.journal')}</h2>
			{#each data.entries as e (e.id)}
				<Card.Root class="border-hairline" data-journal-entry={e.id}>
					<Card.Content class="py-4">
						<p class="text-muted-foreground text-xs">
							{formatTime(i18n.locale, e.createdAt, '2 Jan 2006', timeZone)}{#if e.mood != null}{' ' +
									i18n.tf('mind.entry.mood', e.mood)}{/if}
						</p>
						<p class="mt-1 text-sm">{e.content}</p>
					</Card.Content>
				</Card.Root>
			{/each}
		</section>
	{/if}
</div>
