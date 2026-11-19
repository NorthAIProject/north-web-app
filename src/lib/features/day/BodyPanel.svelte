<!--
	The body figure, coloured by what the last week of logged sets trained,
	with the latest weight, BMI and blood pressure beneath it (web/day
	body.templ). A switch turns the same figure to the day's reported
	soreness, where a tap on a muscle opens the dialog on that zone; knees
	and feet have no muscle to tap and stay chips. The dialog's forms keep
	the dialog open and only the figure and chips change, so the canvas
	never reloads.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import MuscleViewer from '#lib/components/khepri/MuscleViewer.svelte';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js';
	import { quickSubmit } from './forms.js';
	import { stripClass } from './soreness.js';
	import { bmiClass, bodyCaption, bodyMapOrEmpty, sorenessClass, type DayView } from './view.js';

	let { data }: { data: DayView } = $props();
	const i18n = useI18n();
	const b = $derived(data.body);
	const caption = $derived(bodyCaption(i18n, b.map));
	let region = $state('');
	let open = $state(false);
	let mode = $state<'training' | 'soreness'>('training');
	const sore = $derived(mode === 'soreness' ? b.sore : null);
	const soreDays = $derived(b.sore?.strip.filter((d) => d.severity > 0).length ?? 0);

	// A tap in soreness mode: the dialog, already on the tapped muscle's zone.
	function pick(key: string) {
		const zone = b.sore?.zoneOf[key];
		if (!zone) return;
		region = zone;
		open = true;
	}
</script>

<Dialog.Root bind:open>
	<section class="border-hairline bg-surface relative overflow-hidden rounded-2xl border p-4" aria-label={i18n.t('day.body')} data-testid="body-panel">
		{#if b.sore}
			<div class="bg-muted mb-3 grid grid-cols-2 gap-1 rounded-lg p-1" role="group" aria-label={i18n.t('day.body.mode')} data-testid="body-mode">
				{#each ['training', 'soreness'] as const as m (m)}
					<button
						type="button"
						class={cn(
							'rounded-md px-2 py-1 text-xs font-medium transition-colors',
							mode === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
						)}
						aria-pressed={mode === m}
						onclick={() => (mode = m)}>{i18n.t(`day.body.mode.${m}`)}</button
					>
				{/each}
			</div>
		{/if}
		<MuscleViewer
			id="day-body-viewer"
			map={bodyMapOrEmpty(b.map)}
			shape={b.shape}
			soreness={sore?.heat}
			onpick={sore ? pick : undefined}
			ratio="portrait"
			hideLegend
		/>
		{#if sore}
			<p class="text-muted-foreground mt-2 text-center text-xs" data-testid="soreness-caption">{i18n.t('day.soreness.caption')}</p>
			{#if sore.strip.length > 0}
				<div
					class="mt-2 flex gap-0.5"
					role="img"
					aria-label={i18n.tf('day.soreness.strip', soreDays, sore.strip.length)}
					data-testid="soreness-strip"
				>
					{#each sore.strip as d (d.date)}
						<span class={cn('h-2 flex-1 rounded-[2px]', stripClass(d.severity))} data-date={d.date}></span>
					{/each}
				</div>
				<p class="text-muted-foreground mt-1 text-center text-[10px]">{i18n.tf('day.soreness.strip', soreDays, sore.strip.length)}</p>
			{/if}
		{:else if caption}
			<p class="text-muted-foreground mt-2 text-center text-xs" data-testid="body-caption">{caption}</p>
		{/if}
		<div id="body-chips" data-testid="body-chips">
			<div class="mt-3 grid grid-cols-3 gap-2">
				{#if b.hasWeight}
					<div class="bg-background/80 border-hairline rounded-xl border px-2 py-1.5 shadow-sm">
						<p class="text-lg font-semibold tabular-nums">{b.weight}<span class="text-muted-foreground text-[10px] font-normal"> kg</span></p>
						{#if b.hasGoal}
							<p class="text-muted-foreground text-[10px] leading-tight tabular-nums">{i18n.tf('day.body.togoal', b.toGoal)}</p>
						{/if}
					</div>
				{/if}
				{#if b.hasBmi}
					<div class="bg-background/80 border-hairline rounded-xl border px-2 py-1.5 shadow-sm">
						<p class="text-lg font-semibold tabular-nums"><span class="text-muted-foreground text-[10px] font-normal">{i18n.t('day.body.bmi')} </span>{b.bmi}</p>
						<p class={cn('text-[10px] leading-tight font-medium', bmiClass(b.bmiCategory))}>{i18n.t(`day.bmi.${b.bmiCategory}`)}</p>
					</div>
				{:else if b.heightMissing}
					<a href="/app/calculator" class="bg-background/80 border-hairline flex items-center rounded-xl border px-2 py-1.5 text-sm shadow-sm" data-testid="add-height">
						<span class="text-muted-foreground text-[10px] font-normal">{i18n.t('day.body.bmi')}&nbsp;</span>{i18n.t('day.body.addHeight')}
					</a>
				{/if}
				{#if b.hasBloodPressure}
					<div class="bg-background/80 border-hairline rounded-xl border px-2 py-1.5 shadow-sm">
						<p class="text-lg font-semibold tabular-nums">{b.bloodPressure}</p>
						<p class="text-muted-foreground text-[10px] leading-tight">mmHg</p>
					</div>
				{/if}
			</div>
			{#if !b.hasWeight}
				<p class="text-muted-foreground mt-2 text-sm">{i18n.t('day.body.none')}</p>
			{/if}
			<div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
				{#if b.progressDue}
					<a href="/app/progress" class="border-signal/40 bg-signal/10 rounded-full border px-2 py-0.5 font-medium" data-testid="progress-due-chip">{i18n.t('day.progress.due')}</a>
				{/if}
				{#if b.lastWaist}
					<a href="/app/progress" class="text-muted-foreground tabular-nums" data-testid="progress-last">{i18n.tf('day.progress.last', b.lastWaist, b.lastCheckOn)}</a>
				{/if}
				<a href="/app/horizon" class="text-muted-foreground underline underline-offset-4" data-testid="horizon-link">{i18n.t('horizon.link')}</a>
			</div>
			<div class="mt-3 flex flex-wrap gap-1.5" data-testid="soreness">
				{#each b.soreness as so (so.region)}
					<span class={cn('rounded-full px-2 py-0.5 text-xs font-medium', sorenessClass(so.severity))}>
						{i18n.t(`day.region.${so.region}`)} · {i18n.t(`day.severity.${so.severity}`)}
					</span>
				{/each}
			</div>
		</div>
		<Dialog.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline" size="sm" class="mt-3 w-full">{i18n.t('day.body.edit')}</Button>
			{/snippet}
		</Dialog.Trigger>
	</section>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{i18n.t('day.body')}</Dialog.Title>
		</Dialog.Header>
		<form method="post" action="?/soreness" class="space-y-2" use:enhance={quickSubmit(i18n)}>
			<p class="text-sm font-medium">{i18n.t('day.soreness.add')}</p>
			<SearchSelect
				id="region"
				name="region"
				bind:value={region}
				items={data.regions.map((r) => ({ value: r, label: i18n.t(`day.region.${r}`) }))}
				placeholder={i18n.t('day.soreness.region')}
				aria-label={i18n.t('day.soreness.region')}
				search={false}
			/>
			<!-- Two per row on a phone: "Muito doloroso" does not fit a quarter of the dialog. -->
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
				{#each ['1', '2', '3', '0'] as sev (sev)}
					<Button
						type="submit"
						variant="outline"
						size="sm"
						name="severity"
						value={sev}
						class="h-auto min-h-8 py-1.5 leading-tight whitespace-normal">{i18n.t(`day.severity.${sev}`)}</Button
					>
				{/each}
			</div>
		</form>
		<form method="post" action="?/targetWeight" class="space-y-2" use:enhance={quickSubmit(i18n)}>
			<label for="target_weight_kg" class="text-sm font-medium">{i18n.t('day.body.goal')}</label>
			<div class="flex gap-2">
				<Input id="target_weight_kg" name="target_weight_kg" type="number" value={b.target} placeholder="kg" step="0.1" min="20" max="400" />
				<Button type="submit" variant="outline">{i18n.t('day.save')}</Button>
			</div>
		</form>
		<form method="post" action="?/bloodPressure" class="space-y-2" use:enhance={quickSubmit(i18n)}>
			<p class="text-sm font-medium">{i18n.t('day.body.bp')}</p>
			<div class="flex gap-2">
				<Input name="systolic" type="number" placeholder="120" aria-label={i18n.t('day.body.systolic')} min="60" max="260" />
				<Input name="diastolic" type="number" placeholder="80" aria-label={i18n.t('day.body.diastolic')} min="30" max="160" />
				<Button type="submit" variant="outline">{i18n.t('day.save')}</Button>
			</div>
		</form>
		<Button href="/app/calculator" variant="outline" class="w-full">{i18n.t('day.body.record')}</Button>
	</Dialog.Content>
</Dialog.Root>
