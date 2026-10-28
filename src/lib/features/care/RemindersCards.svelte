<!-- What is due now, then every reminder and the add form (Go: remindersCard, manageRemindersCard). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import ActionButton from './ActionButton.svelte';
	import DayChecks from './DayChecks.svelte';
	import { daysSummary, type CareReminder } from './format.js';
	import { careSubmit, dayChecked, typed, type CareFailure } from './forms.js';

	let { reminders, failure }: { reminders: CareReminder[]; failure: CareFailure | null } = $props();
	const i18n = useI18n();

	const due = $derived(reminders.filter((r) => r.due));
	const errors = $derived(failure?.errors ?? {});
	let resetKey = $state(0);
</script>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('care.rem.title')}</Card.Title>
		<Card.Description>{i18n.t(due.length > 0 ? 'care.rem.due' : 'care.rem.none')}</Card.Description>
	</Card.Header>
	{#if due.length > 0}
		<Card.Content>
			<ul class="space-y-2">
				{#each due as r (r.id)}
					<li class="flex items-center justify-between text-sm">
						<span>{r.label}</span>
						<span class="text-muted-foreground text-xs">{r.timeOfDay}</span>
					</li>
				{/each}
			</ul>
		</Card.Content>
	{/if}
</Card.Root>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('care.rem.manage')}</Card.Title>
	</Card.Header>
	<Card.Content>
		{#if reminders.length > 0}
			<ul class="mb-4 space-y-2">
				{#each reminders as r (r.id)}
					<li class="border-hairline flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
						<div>
							<span class="font-medium">{r.label}</span>
							<span class="text-muted-foreground ml-2">{r.timeOfDay} · {daysSummary(i18n, r.daysOfWeek)}</span>
						</div>
						<div class="flex items-center gap-2">
							<ActionButton
								action="?/reminderEnabled"
								fields={{ id: r.id, enabled: r.enabled ? 'false' : 'true' }}
								variant="outline"
							>
								{i18n.t(r.enabled ? 'care.rem.disable' : 'care.rem.enable')}
							</ActionButton>
							<ActionButton action="?/reminderDelete" fields={{ id: r.id }} variant="ghost">
								{i18n.t('care.rem.delete')}
							</ActionButton>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
		{#key resetKey}
			<form method="post" action="?/reminder" class="space-y-4" use:enhance={careSubmit(() => resetKey++)}>
				<div class="flex gap-4">
					<div class="space-y-2">
						<Label for="label">{i18n.t('care.rem.label')}</Label>
						<Input
							id="label"
							name="label"
							value={typed(failure, 'label')}
							placeholder={i18n.t('care.rem.label.ph')}
							required
							aria-invalid={errors.label ? 'true' : undefined}
						/>
					</div>
					<div class="space-y-2">
						<Label for="time_of_day">{i18n.t('care.rem.time')}</Label>
						<Input
							id="time_of_day"
							name="time_of_day"
							type="time"
							value={typed(failure, 'time_of_day')}
							required
							aria-invalid={errors.time_of_day ? 'true' : undefined}
						/>
					</div>
				</div>
				<div>
					<Label>{i18n.t('care.rem.days')}</Label>
					<DayChecks idPrefix="reminder-day" checked={(d) => dayChecked(failure, d)} />
				</div>
				<Button type="submit" class="bg-signal text-background hover:bg-signal/90">{i18n.t('care.rem.add')}</Button>
			</form>
		{/key}
	</Card.Content>
</Card.Root>
