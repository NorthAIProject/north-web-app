<!--
	Today's guided check-in (Go todayForm): five panes behind a step strip.
	Every field stays in the form whichever pane shows, so a save always sends
	the whole check-in. It posts to the page's form action, so it saves without
	JavaScript too; a rejected save comes back with the answers intact and
	opens on the earliest pane with an error (Go FirstErrorStep), with focus on
	the first invalid field. Moving between panes takes focus to the new pane,
	so it never drops to the page when the pressed button hides.
-->
<script lang="ts">
	import { onMount, tick, type Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { FieldMessage, describedBy, focusFirstInvalid } from '#lib/components/ui/field-message/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
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
	let formEl = $state<HTMLFormElement>();
	const panes: HTMLElement[] = [];

	/** Shows pane n and puts focus on it (the pressed button may have just hidden). */
	async function go(n: number) {
		step = n;
		await tick();
		panes[n]?.focus();
	}

	// A rejected save remounts the wizard: land on the field to fix.
	onMount(() => {
		if (Object.keys(errors).length === 0 || !formEl) return;
		if (!focusFirstInvalid(formEl)) panes[step]?.focus();
	});

	const goalItems = $derived([
		{ value: '', label: i18n.t('checkins.goal.none') },
		...activeGoals.map((g) => ({ value: g.id, label: g.title }))
	]);
</script>

{#snippet fieldMessage(id: string, msg: string | undefined)}
	<FieldMessage {id} error={msg} />
{/snippet}

<!--
	Pinned to the bottom of the viewport so the primary action stays under the
	thumb on a phone. A back target of 0 means first pane; next 0 means submit.
-->
{#snippet stepNav(back: number, next: number)}
	<div
		class="border-hairline bg-surface sticky bottom-0 -mx-6 -mb-6 flex gap-2 border-t px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
	>
		{#if back > 0}
			<Button type="button" variant="outline" class="min-h-11 flex-1" onclick={() => go(back)}>
				{i18n.t('checkins.nav.back')}
			</Button>
		{/if}
		{#if next > 0}
			<Button type="button" class="min-h-11 flex-1" onclick={() => go(next)}>
				{i18n.t('checkins.nav.next')}
			</Button>
		{:else}
			<Button type="submit" class="min-h-11 flex-1" disabled={submitting}>
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
			bind:this={formEl}
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
						onclick={() => go(s.n)}
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
			<div
				bind:this={panes[1]}
				class={['space-y-3 outline-none', step !== 1 && 'hidden']}
				role="group"
				aria-label={steps[0].title}
				tabindex="-1"
			>
				<Label>{i18n.t('checkins.q.mood')}</Label>
				<ScalePicker name="mood" legend={i18n.t('checkins.field.mood')} current={form.mood} />
				{@render fieldMessage('mood', errors.mood)}
				{@render stepNav(0, 2)}
			</div>
			<div
				bind:this={panes[2]}
				class={['space-y-3 outline-none', step !== 2 && 'hidden']}
				role="group"
				aria-label={steps[1].title}
				tabindex="-1"
			>
				<Label>{i18n.t('checkins.q.energy')}</Label>
				<ScalePicker name="energy" legend={i18n.t('checkins.field.energy')} current={form.energy} />
				{@render fieldMessage('energy', errors.energy)}
				<!-- Stress and sleep share the energy pane; both may be skipped. -->
				<div class="space-y-3 pt-3">
					<Label>{i18n.t('checkins.q.stress')}</Label>
					<ScalePicker name="stress" legend={i18n.t('checkins.field.stress')} current={form.stress} optional />
					{@render fieldMessage('stress', errors.stress)}
				</div>
				<div class="space-y-3 pt-3">
					<Label>{i18n.t('checkins.q.sleep')}</Label>
					<ScalePicker
						name="sleep_quality"
						legend={i18n.t('checkins.field.sleep')}
						current={form.sleepQuality}
						optional
					/>
					{@render fieldMessage('sleep_quality', errors.sleep_quality)}
				</div>
				{@render stepNav(1, 3)}
			</div>
			<div
				bind:this={panes[3]}
				class={['space-y-3 outline-none', step !== 3 && 'hidden']}
				role="group"
				aria-label={steps[2].title}
				tabindex="-1"
			>
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
							aria-describedby={describedBy('wins', errors.wins)}
						/>
					</DictateField>
					{@render fieldMessage('wins', errors.wins)}
				</div>
				{@render stepNav(2, 4)}
			</div>
			<div
				bind:this={panes[4]}
				class={['space-y-3 outline-none', step !== 4 && 'hidden']}
				role="group"
				aria-label={steps[3].title}
				tabindex="-1"
			>
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
							aria-describedby={describedBy('challenges', errors.challenges)}
						/>
					</DictateField>
					{@render fieldMessage('challenges', errors.challenges)}
				</div>
				{@render stepNav(3, 5)}
			</div>
			<div
				bind:this={panes[5]}
				class={['space-y-3 outline-none', step !== 5 && 'hidden']}
				role="group"
				aria-label={steps[4].title}
				tabindex="-1"
			>
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
							aria-describedby={describedBy('notes', errors.notes)}
						/>
					</DictateField>
					{@render fieldMessage('notes', errors.notes)}
				</div>
				<div class="space-y-2">
					<Label for="tags">{i18n.t('checkins.tags')}</Label>
					<Input
						id="tags"
						name="tags"
						placeholder={i18n.t('checkins.ph.tags')}
						value={form.tags}
						aria-invalid={errors.tags ? 'true' : undefined}
						aria-describedby={describedBy('tags', errors.tags)}
					/>
					{@render fieldMessage('tags', errors.tags)}
				</div>
				{#if activeGoals.length > 0}
					<div class="space-y-2">
						<Label for="related_goal_id">{i18n.t('checkins.goal')}</Label>
						<SearchSelect
							id="related_goal_id"
							name="related_goal_id"
							bind:value={goalId}
							items={goalItems}
							placeholder={i18n.t('checkins.goal.none')}
						/>
						{@render fieldMessage('related_goal_id', errors.related_goal_id)}
					</div>
				{/if}
				{@render stepNav(4, 0)}
			</div>
		</form>
	</Card.Content>
</Card.Root>
