<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { pageTitle } from '#lib/brand.js';
	import Moment from '#lib/components/khepri/Moment.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Button, type ButtonVariant } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import DictateField from '#lib/features/checkins/DictateField.svelte';
	import ConfirmForm from '#lib/features/goals/ConfirmForm.svelte';
	import GoalFields from '#lib/features/goals/GoalFields.svelte';
	import {
		categoryLabel,
		deadlineLabel,
		formFor,
		isActive,
		milestoneDate,
		momentFrom,
		overdue,
		progress,
		progressLabel,
		statusLabel,
		type Milestone
	} from '#lib/features/goals/goals.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();
	const timeZone = $derived(data.user.timezone || 'UTC');
	const g = $derived(data.goal);
	const pct = $derived(progress(g));
	const moment = $derived(momentFrom(i18n, g, data.done));

	// Which failure came back, if any (Go: Open, UpdateError, MilestoneErrors).
	const goalFailure = $derived(form?.kind === 'goal' ? form : null);
	const noteError = $derived(form?.kind === 'note' ? form.error : '');
	const msFailure = $derived(form?.kind === 'milestone' ? form : null);

	// svelte-ignore state_referenced_locally
	let editing = $state(Boolean(goalFailure));
	// Each milestone row opens its own editor (Go: x-data per row).
	// svelte-ignore state_referenced_locally
	let editingMilestones = $state<Record<string, boolean>>(msFailure?.editing ? { [msFailure.editing]: true } : {});
	$effect(() => {
		if (goalFailure) editing = true;
		if (msFailure?.editing) editingMilestones[msFailure.editing] = true;
	});
	// A navigation to another goal starts closed.
	$effect(() => {
		void g.id;
		return () => {
			editing = false;
			editingMilestones = {};
		};
	});

	let busy = $state(false);
	// Go answered every form with a redirect that reloaded the page, so a
	// success starts each form afresh; a rejection keeps what was typed.
	const submit = ({ formElement }: { formElement: HTMLFormElement }) => {
		busy = true;
		return async ({ result, update }: { result: { type: string }; update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = false;
			if (result.type === 'redirect') formElement.reset();
		};
	};

	const msError = (field: string, mid = '') =>
		msFailure && msFailure.editing === mid ? (msFailure.errors as Record<string, string>)[field] : undefined;
	const editTitle = (m: Milestone) =>
		msFailure?.editing === m.id && msFailure.values.title ? msFailure.values.title : m.title;
	const editDate = (m: Milestone) =>
		msFailure?.editing === m.id && msFailure.values.date ? msFailure.values.date : (m.targetDate ?? '');
	const addValues = $derived(msFailure && !msFailure.editing ? msFailure.values : { title: '', date: '' });
</script>

<svelte:head><title>{pageTitle(g.title)}</title></svelte:head>

{#snippet statusButton(status: string, label: string, variant: ButtonVariant)}
	<form method="post" action="?/status" use:enhance={submit}>
		<input type="hidden" name="status" value={status} />
		<Button type="submit" size="sm" {variant} disabled={busy}>{label}</Button>
	</form>
{/snippet}

{#snippet milestoneStatusButton(m: Milestone, status: string, label: string, variant: ButtonVariant)}
	<form method="post" action="?/milestoneStatus" use:enhance={submit}>
		<input type="hidden" name="milestone_id" value={m.id} />
		<input type="hidden" name="status" value={status} />
		<Button type="submit" size="sm" {variant} disabled={busy}>{label}</Button>
	</form>
{/snippet}

{#snippet message(msg: string | undefined)}
	{#if msg}
		<p class="text-[0.8rem] font-medium text-red-500">{msg}</p>
	{/if}
{/snippet}

<div class="mx-auto w-full max-w-3xl p-6 md:p-8">
	<a href="/app/goals" class="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm">
		<ArrowLeftIcon class="size-4" />
		{i18n.t('goals.back')}
	</a>
	{#if moment}
		<div class="mb-6"><Moment {moment} /></div>
	{/if}
	<header class="mb-6">
		<div class="flex items-start justify-between gap-4">
			<h1 class="text-2xl font-semibold tracking-tight">{g.title}</h1>
			<Button variant="outline" size="sm" onclick={() => (editing = !editing)} aria-expanded={editing}>
				{i18n.t('goals.edit')}
			</Button>
		</div>
		<div class="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
			<span>{categoryLabel(i18n, g.category)}</span>
			<span>·</span>
			<span class={[overdue(g) && 'text-destructive']}>{deadlineLabel(i18n, g)}</span>
			<span>·</span>
			<span>{statusLabel(i18n, g.status)}</span>
			{#if pct != null}
				<span>·</span>
				<span>{progressLabel(i18n, g)}</span>
			{/if}
		</div>
	</header>
	{#if editing}
		<div class="mb-6">
			<Card.Root>
				<Card.Content>
					<form method="post" action="?/update" class="space-y-4 pt-6" use:enhance={submit}>
						<GoalFields form={goalFailure?.values ?? formFor(g)} errors={goalFailure?.errors ?? {}} />
						<div class="flex gap-2">
							<Button type="submit" disabled={busy}>{i18n.t('goals.save')}</Button>
							<Button variant="ghost" onclick={() => (editing = false)}>{i18n.t('goals.cancel')}</Button>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
	{#if !goalFailure && (g.motivation || g.success)}
		<Card.Root class="mb-6">
			<Card.Content>
				<dl class="space-y-4 pt-6 text-sm">
					{#if g.motivation}
						<div>
							<dt class="text-muted-foreground text-xs uppercase tracking-wide">{i18n.t('goals.why')}</dt>
							<dd class="mt-1">{g.motivation}</dd>
						</div>
					{/if}
					{#if g.success}
						<div>
							<dt class="text-muted-foreground text-xs uppercase tracking-wide">{i18n.t('goals.donewhen')}</dt>
							<dd class="mt-1">{g.success}</dd>
						</div>
					{/if}
				</dl>
			</Card.Content>
		</Card.Root>
	{/if}
	<!-- Only the transitions that make sense from here. -->
	<div class="mb-6 flex flex-wrap gap-2">
		{#if isActive(g)}
			{@render statusButton('achieved', i18n.t('goals.action.achieved'), 'default')}
			{@render statusButton('paused', i18n.t('goals.action.pause'), 'outline')}
			{@render statusButton('abandoned', i18n.t('goals.action.letgo'), 'ghost')}
		{:else}
			{@render statusButton('active', i18n.t('goals.action.reactivate'), 'outline')}
		{/if}
	</div>
	<Card.Root class="mb-6">
		<Card.Header>
			<Card.Title class="text-base">{i18n.t('goals.milestones')}</Card.Title>
			<Card.Description>
				{g.milestones.length === 0
					? i18n.t('goals.milestones.desc')
					: i18n.tf('goals.ms.done', progressLabel(i18n, g))}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if pct != null && g.milestoneTotal > 0}
				<div class="mb-4"><Progress value={pct} max={100} size="sm" showValue /></div>
			{/if}
			{#if g.milestones.length > 0}
				<ul class="mb-4 space-y-2">
					{#each g.milestones as m (m.id)}
						{@const complete = m.status === 'completed'}
						<li class="border-border rounded-lg border p-3" data-milestone={m.id}>
							{#if !editingMilestones[m.id]}
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class={['text-sm font-medium', complete && 'text-muted-foreground line-through']}>{m.title}</p>
										{#if m.targetDate}
											<p class="text-muted-foreground mt-0.5 text-xs">{milestoneDate(i18n, m.targetDate)}</p>
										{/if}
									</div>
									<div class="flex shrink-0 flex-wrap items-center justify-end gap-1">
										{#if complete}
											{@render milestoneStatusButton(m, 'open', i18n.t('goals.ms.reopen'), 'ghost')}
										{:else}
											{@render milestoneStatusButton(m, 'completed', i18n.t('goals.ms.complete'), 'outline')}
										{/if}
										<Button variant="ghost" size="sm" onclick={() => (editingMilestones[m.id] = true)}>
											{i18n.t('goals.edit')}
										</Button>
										<ConfirmForm
											id="delete-milestone-{m.id}"
											action="?/deleteMilestone"
											message={i18n.t('goals.ms.remove.confirm')}
											confirmLabel={i18n.t('goals.remove')}
										>
											{#snippet fields()}<input type="hidden" name="milestone_id" value={m.id} />{/snippet}
											{#snippet trigger(props)}
												<Button {...props} size="sm" variant="ghost">{i18n.t('goals.remove')}</Button>
											{/snippet}
										</ConfirmForm>
									</div>
								</div>
							{:else}
								<form method="post" action="?/editMilestone" class="space-y-3" use:enhance={submit}>
									<input type="hidden" name="milestone_id" value={m.id} />
									<div class="space-y-2">
										<Label for="milestone_title_{m.id}" error={msError('title', m.id)}>{i18n.t('goals.ms.title')}</Label>
										<Input
											id="milestone_title_{m.id}"
											name="milestone_title"
											value={editTitle(m)}
											required
											aria-invalid={msError('title', m.id) ? 'true' : undefined}
										/>
										{@render message(msError('title', m.id))}
									</div>
									<div class="space-y-2">
										<Label for="milestone_date_{m.id}">{i18n.t('goals.ms.date')}</Label>
										<Input id="milestone_date_{m.id}" name="milestone_date" type="date" value={editDate(m)} />
									</div>
									<div class="flex gap-2">
										<Button type="submit" size="sm" disabled={busy}>{i18n.t('goals.save')}</Button>
										<Button variant="ghost" size="sm" onclick={() => (editingMilestones[m.id] = false)}>
											{i18n.t('goals.cancel')}
										</Button>
									</div>
								</form>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
			<form method="post" action="?/addMilestone" class="space-y-3" use:enhance={submit}>
				<div class="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
					<div class="space-y-2">
						<Label for="milestone_title" error={msError('title')}>{i18n.t('goals.ms.add')}</Label>
						<Input
							id="milestone_title"
							name="milestone_title"
							value={addValues.title}
							placeholder={i18n.t('goals.ms.title.ph')}
							aria-invalid={msError('title') ? 'true' : undefined}
						/>
						{@render message(msError('title'))}
					</div>
					<div class="w-full space-y-2 sm:w-40">
						<Label for="milestone_date">{i18n.t('goals.ms.date')}</Label>
						<Input id="milestone_date" name="milestone_date" type="date" value={addValues.date} />
					</div>
				</div>
				<Button type="submit" size="sm" disabled={busy}>{i18n.t('goals.ms.create')}</Button>
			</form>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">{i18n.t('goals.progress.q')}</Card.Title>
			<Card.Description>{i18n.t('goals.progress.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="post"
				action="?/note"
				class="space-y-3"
				use:enhance={submit}
			>
				<DictateField target="note">
					<Textarea
						id="note"
						name="note"
						placeholder={i18n.t('goals.progress.ph')}
						rows={2}
						aria-invalid={noteError ? 'true' : undefined}
					/>
				</DictateField>
				{@render message(noteError)}
				<div class="flex items-end gap-3">
					<div class="w-32">
						<Label for="progress" class="text-xs">{i18n.t('goals.progress.pct')}</Label>
						<Input
							id="progress"
							name="progress"
							type="number"
							placeholder={i18n.t('goals.progress.pct.ph')}
							min="0"
							max="100"
						/>
					</div>
					<Button type="submit" size="sm" disabled={busy}>{i18n.t('goals.progress.add')}</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
	{#if g.updates.length > 0}
		<h2 class="mt-8 mb-3 text-sm font-medium">{i18n.t('goals.updates')}</h2>
		<div class="space-y-3">
			{#each g.updates as u (u.id)}
				<div class="border-border rounded-lg border p-4" data-goal-update={u.id}>
					<div class="text-muted-foreground mb-1 flex items-center gap-2 text-xs">
						<span>{formatTime(i18n.locale, u.createdAt, '2 January 2006, 15:04', timeZone)}</span>
						{#if u.progress != null}
							<span>·</span>
							<span>{u.progress}%</span>
						{/if}
					</div>
					<p class="text-sm whitespace-pre-wrap">{u.note}</p>
				</div>
			{/each}
		</div>
	{/if}
	<div class="border-border mt-10 border-t pt-6">
		<ConfirmForm
			id="delete-goal"
			action="?/delete"
			message={i18n.t('goals.delete.confirm')}
			confirmLabel={i18n.t('goals.delete')}
		>
			{#snippet trigger(props)}
				<button {...props} class="text-muted-foreground hover:text-destructive text-sm transition-colors">
					{i18n.t('goals.delete')}
				</button>
			{/snippet}
		</ConfirmForm>
	</div>
</div>
