<!--
	Today's guided check-in (Go todayForm): five panes behind a step strip.
	Every field stays in the form whichever pane shows, so a save always sends
	the whole check-in. It posts to the page's form action, so it saves without
	JavaScript too; a rejected save comes back with the answers intact and
	opens on the earliest pane with an error (Go FirstErrorStep).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { firstErrorStep, type CheckInForm } from './checkins.js';
	import DictateField from './DictateField.svelte';
	import ScalePicker from './ScalePicker.svelte';

	let {
		form,
		errors = {},
		activeGoals,
		first,
		action,
		onresult,
		mic
	}: {
		form: CheckInForm;
		errors?: Record<string, string>;
		activeGoals: { id: string; title: string }[];
		/** No check-in yet: the description says this is the first. */
		first: boolean;
		/** The form action the wizard posts to. */
		action: string;
		/** Called with the action's result once the page has updated. */
		onresult?: (result: ActionResult) => void;
		/** The dictation mic, see DictateField. */
		mic?: Snippet<[target: string]>;
	} = $props();

	const i18n = useI18n();
	// The wizard is remounted for each new form, so these start from its props.
	// svelte-ignore state_referenced_locally
	let step = $state(firstErrorStep(errors));
	// svelte-ignore state_referenced_locally
	let goalId = $state(form.goalId);
	let submitting = $state(false);

	const steps = $derived([
		{ n: 1, title: i18n.t('checkins.field.mood') },
		{ n: 2, title: i18n.t('checkins.field.energy') },
		{ n: 3, title: i18n.t('checkins.step.wins') },
		{ n: 4, title: i18n.t('checkins.step.hard') },
		{ n: 5, title: i18n.t('checkins.step.notes') }
	]);
	const goalItems = $derived([
		{ value: '', label: i18n.t('checkins.goal.none') },
		...activeGoals.map((g) => ({ value: g.id, label: g.title }))
	]);
	const goalLabel = $derived(goalItems.find((g) => g.value === goalId && g.value !== '')?.label);
</script>

{#snippet fieldMessage(msg: string | undefined)}
	{#if msg}
		<p class="text-[0.8rem] font-medium text-red-500">{msg}</p>
	{/if}
{/snippet}

<!--
	Pinned to the bottom of the viewport so the primary action stays under the
	thumb on a phone. A back target of 0 means first pane; next 0 means submit.
-->
{#snippet stepNav(back: number, next: number)}
	<div
		class="border-hairline bg-surface/95 sticky bottom-0 -mx-6 -mb-6 flex gap-2 border-t px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
	>
		{#if back > 0}
			<Button type="button" variant="outline" class="min-h-11 flex-1" onclick={() => (step = back)}>
				{i18n.t('checkins.nav.back')}
			</Button>
		{/if}
		{#if next > 0}
			<Button type="button" class="min-h-11 flex-1" onclick={() => (step = next)}>
				{i18n.t('checkins.nav.next')}
			</Button>
		{:else}
			<Button type="submit" class="bg-signal text-background hover:bg-signal/90 min-h-11 flex-1" disabled={submitting}>
				{i18n.t('checkins.nav.save')}
			</Button>
		{/if}
	</div>
{/snippet}

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('checkins.today')}</Card.Title>
		<Card.Description>{i18n.t(first ? 'checkins.first' : 'checkins.again')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<form
			method="post"
			{action}
			class="space-y-6"
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					await update({ reset: false });
					submitting = false;
					onresult?.(result);
				};
			}}
		>
			<!-- Doubles as progress and as navigation back to an earlier answer. -->
			<div class="flex flex-wrap gap-1.5">
				{#each steps as s (s.n)}
					<button
						type="button"
						onclick={() => (step = s.n)}
						aria-current={step === s.n ? 'step' : undefined}
						class={[
							'min-h-11 rounded-full border px-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors',
							step >= s.n ? 'border-signal/40 text-signal' : 'border-hairline text-muted-foreground'
						]}
					>
						{s.title}
					</button>
				{/each}
			</div>
			<div class={['space-y-3', step !== 1 && 'hidden']}>
				<Label>{i18n.t('checkins.q.mood')}</Label>
				<ScalePicker name="mood" legend={i18n.t('checkins.field.mood')} current={form.mood} />
				{@render fieldMessage(errors.mood)}
				{@render stepNav(0, 2)}
			</div>
			<div class={['space-y-3', step !== 2 && 'hidden']}>
				<Label>{i18n.t('checkins.q.energy')}</Label>
				<ScalePicker name="energy" legend={i18n.t('checkins.field.energy')} current={form.energy} />
				{@render fieldMessage(errors.energy)}
				<!-- Stress and sleep share the energy pane; both may be skipped. -->
				<div class="space-y-3 pt-3">
					<Label>{i18n.t('checkins.q.stress')}</Label>
					<ScalePicker name="stress" legend={i18n.t('checkins.field.stress')} current={form.stress} optional />
					{@render fieldMessage(errors.stress)}
				</div>
				<div class="space-y-3 pt-3">
					<Label>{i18n.t('checkins.q.sleep')}</Label>
					<ScalePicker
						name="sleep_quality"
						legend={i18n.t('checkins.field.sleep')}
						current={form.sleepQuality}
						optional
					/>
					{@render fieldMessage(errors.sleep_quality)}
				</div>
				{@render stepNav(1, 3)}
			</div>
			<div class={['space-y-3', step !== 3 && 'hidden']}>
				<div class="space-y-2">
					<Label for="wins">{i18n.t('checkins.q.wins')}</Label>
					<DictateField target="wins" {mic}>
						<Textarea
							id="wins"
							name="wins"
							rows={3}
							placeholder={i18n.t('checkins.ph.wins')}
							value={form.wins}
							aria-invalid={errors.wins ? 'true' : undefined}
						/>
					</DictateField>
					{@render fieldMessage(errors.wins)}
				</div>
				{@render stepNav(2, 4)}
			</div>
			<div class={['space-y-3', step !== 4 && 'hidden']}>
				<div class="space-y-2">
					<Label for="challenges">{i18n.t('checkins.q.hard')}</Label>
					<DictateField target="challenges" {mic}>
						<Textarea
							id="challenges"
							name="challenges"
							rows={3}
							placeholder={i18n.t('checkins.ph.hard')}
							value={form.challenges}
							aria-invalid={errors.challenges ? 'true' : undefined}
						/>
					</DictateField>
					{@render fieldMessage(errors.challenges)}
				</div>
				{@render stepNav(3, 5)}
			</div>
			<div class={['space-y-3', step !== 5 && 'hidden']}>
				<div class="space-y-2">
					<Label for="notes">{i18n.t('checkins.q.notes')}</Label>
					<DictateField target="notes" {mic}>
						<Textarea
							id="notes"
							name="notes"
							rows={3}
							placeholder={i18n.t('checkins.ph.notes')}
							value={form.notes}
							aria-invalid={errors.notes ? 'true' : undefined}
						/>
					</DictateField>
					{@render fieldMessage(errors.notes)}
				</div>
				<div class="space-y-2">
					<Label for="tags">{i18n.t('checkins.tags')}</Label>
					<Input
						id="tags"
						name="tags"
						placeholder={i18n.t('checkins.ph.tags')}
						value={form.tags}
						aria-invalid={errors.tags ? 'true' : undefined}
					/>
					{@render fieldMessage(errors.tags)}
				</div>
				{#if activeGoals.length > 0}
					<div class="space-y-2">
						<Label for="related_goal_id">{i18n.t('checkins.goal')}</Label>
						<Select.Root type="single" name="related_goal_id" bind:value={goalId} items={goalItems}>
							<Select.Trigger id="related_goal_id">
								<span data-slot="select-value" class={['block truncate', !goalLabel && 'text-muted-foreground']}>
									{goalLabel ?? i18n.t('checkins.goal.none')}
								</span>
							</Select.Trigger>
							<Select.Content>
								{#each goalItems as g (g.value)}
									<Select.Item value={g.value} label={g.label} />
								{/each}
							</Select.Content>
						</Select.Root>
						{@render fieldMessage(errors.related_goal_id)}
					</div>
				{/if}
				{@render stepNav(4, 0)}
			</div>
		</form>
	</Card.Content>
</Card.Root>
