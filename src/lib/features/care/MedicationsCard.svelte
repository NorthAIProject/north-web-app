<!--
	Today's doses, as-needed doses, the medication list and the add form
	(Go: web/care/medications.templ medicationsCard).
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { FieldMessage, describedBy } from '#lib/components/ui/field-message/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { useI18n } from '#lib/i18n/index.js';
	import ActionButton from './ActionButton.svelte';
	import { medicationLabel, medicationSchedule, slotBadge, slotStatusLabel, type Medications } from './format.js';
	import { careSubmit, typed, type CareFailure } from './forms.js';

	let {
		medications,
		failure,
		timezone
	}: { medications: Medications; failure: CareFailure | null; timezone: string } = $props();
	const i18n = useI18n();

	const meds = $derived(medications.medications);
	const day = $derived(medications.today);
	// The take button shows only for a medication with no schedule (Go:
	// u.Medication.AsNeeded()); the list says which those are.
	const asNeededIDs = $derived(new Set(meds.filter((m) => m.asNeeded).map((m) => m.id)));
	const errors = $derived(failure?.errors ?? {});
	let resetKey = $state(0);
</script>

{#snippet dose(medicationId: string, slot: string, status: string, text: string, primary: boolean)}
	<ActionButton
		action="?/dose"
		fields={slot ? { id: medicationId, status, slot } : { id: medicationId, status }}
		variant={primary ? 'default' : 'outline'}
	>
		{text}
	</ActionButton>
{/snippet}

{#snippet undo(logId: string)}
	<ActionButton action="?/undoDose" fields={{ id: logId }} variant="ghost">{i18n.t('care.meds.undo')}</ActionButton>
{/snippet}

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('care.meds.title')}</Card.Title>
		<Card.Description>{i18n.t('care.meds.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if meds.length === 0}
			<p class="text-muted-foreground mb-4 text-sm">{i18n.t('care.meds.none')}</p>
		{/if}
		{#if day.slots.length > 0}
			<MonoLabel text={i18n.t('care.meds.today')} />
			<ul class="mb-6 mt-2 space-y-2">
				{#each day.slots as s (s.medicationId + s.time)}
					<li class="border-hairline flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
						<div class="min-w-0">
							<span class="font-mono text-xs">{s.time}</span>
							<span class="ml-2 text-sm font-medium">{medicationLabel(s)}</span>
						</div>
						<div class="flex shrink-0 items-center gap-2">
							<Badge variant={slotBadge(s.status)}>{slotStatusLabel(i18n, s.status)}</Badge>
							{#if s.logId}
								{@render undo(s.logId)}
							{:else}
								{@render dose(s.medicationId, s.time, 'taken', i18n.t('care.meds.take'), true)}
								{@render dose(s.medicationId, s.time, 'skipped', i18n.t('care.meds.skip'), false)}
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
		{#if day.asNeeded.length > 0}
			<MonoLabel text={i18n.t('care.meds.asneeded')} />
			<ul class="mb-6 mt-2 space-y-2">
				{#each day.asNeeded as u (u.medicationId)}
					<li class="border-hairline rounded-lg border px-3 py-2">
						<div class="flex items-center justify-between gap-3">
							<span class="text-sm font-medium">{medicationLabel(u)}</span>
							{#if asNeededIDs.has(u.medicationId)}
								{@render dose(u.medicationId, '', 'taken', i18n.t('care.meds.tookone'), true)}
							{/if}
						</div>
						{#if u.doses.length === 0}
							<p class="text-muted-foreground mt-1 text-xs">{i18n.t('care.meds.asneeded.none')}</p>
						{:else}
							<ul class="mt-1 space-y-1">
								{#each u.doses as d (d.id)}
									<li class="text-muted-foreground flex items-center justify-between text-xs">
										<span>{formatTime(i18n.locale, d.loggedAt, '15:04', timezone)} · {slotStatusLabel(i18n, d.status)}</span>
										{@render undo(d.id)}
									</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
		{#if meds.length > 0}
			<MonoLabel text={i18n.t('care.meds.manage')} />
			<ul class="mb-6 mt-2 space-y-2">
				{#each meds as m (m.id)}
					<li class="border-hairline flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
						<div class="min-w-0">
							<span class="font-medium">{medicationLabel(m)}</span>
							<span class="text-muted-foreground ml-2">{medicationSchedule(i18n, m)}</span>
						</div>
						<ActionButton action="?/medicationStop" fields={{ id: m.id }} variant="ghost">
							{i18n.t('care.meds.stop')}
						</ActionButton>
					</li>
				{/each}
			</ul>
		{/if}
		{#key resetKey}
			<form method="post" action="?/medication" class="space-y-4" use:enhance={careSubmit(() => resetKey++)}>
				<div class="flex flex-wrap gap-4">
					<div class="space-y-2">
						<Label for="med_name">{i18n.t('care.meds.name')}</Label>
						<Input
							id="med_name"
							name="name"
							value={typed(failure, 'name')}
							required
							placeholder={i18n.t('care.meds.name.ph')}
							aria-invalid={errors.name ? 'true' : undefined}
							aria-describedby={describedBy('med_name', errors.name)}
						/>
					</div>
					<div class="space-y-2">
						<Label for="med_dose">{i18n.t('care.meds.dose')}</Label>
						<Input
							id="med_dose"
							name="dose"
							value={typed(failure, 'dose')}
							placeholder={i18n.t('care.meds.dose.ph')}
							aria-invalid={errors.dose ? 'true' : undefined}
							aria-describedby={describedBy('med_dose', errors.dose)}
						/>
					</div>
					<div class="space-y-2">
						<Label for="med_times">{i18n.t('care.meds.times')}</Label>
						<!-- A format, not a word: the same in every language. -->
						<Input
							id="med_times"
							name="times"
							value={typed(failure, 'times')}
							placeholder="08:00, 20:00"
							aria-invalid={errors.times ? 'true' : undefined}
							aria-describedby={describedBy('med_times', errors.times)}
						/>
						<p class="text-muted-foreground text-sm">{i18n.t('care.meds.times.help')}</p>
					</div>
				</div>
				{#each ['name', 'dose', 'times'] as field (field)}
					<FieldMessage id="med_{field}" error={errors[field]} />
				{/each}
				<Button type="submit">{i18n.t('care.meds.add')}</Button>
			</form>
		{/key}
	</Card.Content>
</Card.Root>
