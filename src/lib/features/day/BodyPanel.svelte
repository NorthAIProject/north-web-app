<!--
	The body figure, coloured by what the last week of logged sets trained,
	with the latest weight, BMI and blood pressure beneath it (web/day
	body.templ). Soreness stays a row of chips: the figure means training.
	The dialog's forms keep the dialog open and only the chips change, as
	Go's #body-chips swap did, so the canvas never reloads.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import MuscleViewer from '#lib/components/khepri/MuscleViewer.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js';
	import { quickSubmit } from './forms.js';
	import { bmiClass, bodyCaption, bodyMapOrEmpty, sorenessClass, type DayView } from './view.js';

	let { data }: { data: DayView } = $props();
	const i18n = useI18n();
	const b = $derived(data.body);
	const caption = $derived(bodyCaption(i18n, b.map));
	let region = $state('');
	let open = $state(false);
</script>

<Dialog.Root bind:open>
	<section class="border-hairline bg-surface relative overflow-hidden rounded-2xl border p-4" aria-label={i18n.t('day.body')} data-testid="body-panel">
		<MuscleViewer id="day-body-viewer" map={bodyMapOrEmpty(b.map)} shape={b.shape} hideLegend />
		{#if caption}
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
			{#if b.progressDue || b.lastWaist}
				<div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
					{#if b.progressDue}
						<a href="/app/progress" class="border-signal/40 bg-signal/10 rounded-full border px-2 py-0.5 font-medium" data-testid="progress-due-chip">{i18n.t('day.progress.due')}</a>
					{/if}
					{#if b.lastWaist}
						<a href="/app/progress" class="text-muted-foreground tabular-nums" data-testid="progress-last">{i18n.tf('day.progress.last', b.lastWaist, b.lastCheckOn)}</a>
					{/if}
				</div>
			{/if}
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
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{i18n.t('day.body')}</Dialog.Title>
		</Dialog.Header>
		<form method="post" action="?/soreness" class="space-y-2" use:enhance={quickSubmit(i18n)}>
			<p class="text-sm font-medium">{i18n.t('day.soreness.add')}</p>
			<Select.Root type="single" name="region" bind:value={region}>
				<Select.Trigger id="region">
					{region ? i18n.t(`day.region.${region}`) : i18n.t('day.soreness.region')}
				</Select.Trigger>
				<Select.Content>
					{#each data.regions as r (r)}
						<Select.Item value={r} label={i18n.t(`day.region.${r}`)}>{i18n.t(`day.region.${r}`)}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<div class="grid grid-cols-4 gap-2">
				{#each ['1', '2', '3', '0'] as sev (sev)}
					<Button type="submit" variant="outline" size="sm" name="severity" value={sev}>{i18n.t(`day.severity.${sev}`)}</Button>
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
