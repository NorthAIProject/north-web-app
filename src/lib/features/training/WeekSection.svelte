<!--
	The week card on the followed plan's page, and the editor it opens
	(north-client week.templ WeekCard + WeekEditor). Every change in the editor
	asks the server for the week it would make, so the rotation is visible
	before anything is saved. Go swapped #training-week whole over htmx; here
	the section holds the week and the editor's form as state.
-->
<script lang="ts">
	import { browserApi } from '#lib/api/client.js';
	import { isApiError } from '#lib/api/errors.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PlanSummary, TrainingWeek, WeekRequest } from './types.js';
	import {
		fromOtherPlan,
		isClosed,
		matchingExcept,
		sessionOptions,
		sessionValue,
		stillOpen,
		todayPosition,
		weekDate,
		weekQuery,
		weekRequest,
		weekText
	} from './week.js';
	import { WEEKDAYS, weekdayShort } from './weekday.js';

	let {
		initialWeek,
		plans,
		todayWeekday
	}: {
		initialWeek: TrainingWeek;
		/** Saved plans, the followed one first (Go: ListCurrentPlans). */
		plans: PlanSummary[];
		/** Today's English weekday in the person's zone. */
		todayWeekday: string;
	} = $props();

	const i18n = useI18n();
	const api = browserApi();

	// The section's own state, seeded once from the page load; every week
	// fragment Go swapped in replaces it.
	// svelte-ignore state_referenced_locally
	let week: TrainingWeek = $state(initialWeek);
	let nextWeek = $state(false);
	let editing = $state(false);
	let busy = $state(false);

	// The editor's form.
	let chosen: string[] = $state([]);
	let source = $state('');
	let pins: Record<string, string> = $state({});
	let error = $state('');
	/** The days the editor shows: the week it would make. Set when it opens. */
	let shown: TrainingWeek['days'] = $state([]);

	const NEXT = '__next';
	const active = $derived(plans.find((p) => p.active) ?? plans[0]);
	const activeID = $derived(active?.id ?? '');
	const today = $derived(todayPosition(nextWeek, todayWeekday));
	const sessions = $derived(sessionOptions(plans));
	const matching = $derived(matchingExcept(plans, shown.length, source));
	const query = $derived(weekQuery(nextWeek));

	async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
		busy = true;
		try {
			return await fn();
		} finally {
			busy = false;
		}
	}

	async function load(next: boolean) {
		const { data } = await api.GET('/training/week', { params: { query: weekQuery(next) } });
		return data!;
	}

	async function showWeek(next: boolean) {
		const w = await run(() => load(next));
		if (!w) return;
		nextWeek = next;
		week = w;
		editing = false;
	}

	/** Opens the editor on the week as it stands (Go: editWeek). */
	function openEditor() {
		shown = stillOpen(week.days, today);
		chosen = shown.map((d) => d.weekday);
		source = activeID;
		pins = Object.fromEntries(
			shown.map((d) => [d.weekday, fromOtherPlan(d, activeID) ? sessionValue(d.planId, d.dayIndex) : ''])
		);
		error = '';
		editing = true;
	}

	/** What the form says now, as a week request; closed days do not post. */
	function formRequest(): WeekRequest {
		const open = chosen.filter((wd) => !isClosed({ ...week, days: shown }, wd, today));
		const pinned = Object.fromEntries(Object.entries(pins).map(([wd, v]) => [wd, v === NEXT ? '' : v]));
		return weekRequest({ weekdays: open, planId: source, pins: pinned });
	}

	/** Every change answers with the week it would make (Go: previewWeek). */
	async function preview(req: WeekRequest) {
		await run(async () => {
			const keep = Object.fromEntries((req.assignments ?? []).map((a) => [a.weekday, sessionValue(a.planId, a.dayIndex)]));
			try {
				const { data } = await api.POST('/training/week/suggestion', { params: { query }, body: req });
				shown = data!.week.days;
				error = '';
			} catch (err) {
				if (!isApiError(err) || err.status !== 422) throw err;
				// Show the editor again with the reason rather than a bare error.
				error = Object.values(err.fields)[0] ?? err.message;
				shown = (await load(nextWeek)).days;
			}
			if (req.planId) source = req.planId;
			chosen = shown.map((d) => d.weekday);
			// A day pinned by hand stays pinned; every other day shows the rotation.
			pins = Object.fromEntries(shown.map((d) => [d.weekday, keep[d.weekday] ?? '']));
		});
	}

	async function save() {
		const req = formRequest();
		await run(async () => {
			try {
				const { data } = await api.PUT('/training/week', { params: { query }, body: req });
				week = data!;
				editing = false;
			} catch (err) {
				if (!isApiError(err) || err.status !== 422) throw err;
				error = Object.values(err.fields)[0] ?? err.message;
			}
		});
	}

	async function reset() {
		await run(async () => {
			const { data } = await api.DELETE('/training/week', { params: { query } });
			week = data!;
		});
	}

	function toggle(weekday: string, on: boolean) {
		chosen = on ? [...chosen, weekday] : chosen.filter((d) => d !== weekday);
		void preview(formRequest());
	}
</script>

{#if !editing}
	<section id="training-week" class="mb-6" data-testid="training-week">
		<Card.Root>
			<Card.Header>
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div>
						<Card.Title class="text-base">{weekText(i18n, 'workouts.week.title', nextWeek)}</Card.Title>
						<p class="text-muted-foreground mt-1 text-sm">
							{i18n.tf('workouts.week.summary', week.days.length, weekDate(i18n, week.weekStart))}
							{#if week.custom}
								· {i18n.t('workouts.week.custom')}
							{/if}
						</p>
					</div>
					<Button variant="ghost" size="sm" disabled={busy} onclick={() => showWeek(!nextWeek)}>
						{nextWeek ? i18n.t('workouts.week.title.this') : i18n.t('workouts.week.title.next')}
					</Button>
				</div>
			</Card.Header>
			<Card.Content>
				{#if week.days.length === 0}
					<p class="text-muted-foreground text-sm">{i18n.t('workouts.week.rest')}</p>
				{/if}
				<ul class="divide-border divide-y">
					{#each week.days as d (d.date)}
						<li class="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
							<span class="w-24 shrink-0 text-sm font-medium">{weekDate(i18n, d.date)}</span>
							<span class="min-w-0 flex-1 text-sm">
								{d.focus}
								{#if fromOtherPlan(d, activeID)}
									<span class="text-muted-foreground">· {d.planName}</span>
								{/if}
							</span>
							{#if d.startTime}
								<span class="text-muted-foreground font-mono text-xs">{d.startTime}</span>
							{/if}
							{#if d.completed}
								<Badge variant="outline" class="border-signal/40 text-signal">{i18n.t('workouts.status.completed')}</Badge>
							{:else if d.isNext}
								<Badge class="bg-signal text-background">{i18n.t('workouts.status.next')}</Badge>
							{/if}
						</li>
					{/each}
				</ul>
				<div class="mt-4 flex flex-wrap gap-2">
					<Button variant="outline" size="sm" disabled={busy} onclick={openEditor}>
						{weekText(i18n, 'workouts.week.change', nextWeek)}
					</Button>
					{#if week.custom}
						<Button variant="ghost" size="sm" disabled={busy} onclick={reset}>{i18n.t('workouts.week.reset')}</Button>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</section>
{:else}
	<section id="training-week" class="mb-6" data-testid="training-week-editor">
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">{weekText(i18n, 'workouts.week.change', nextWeek)}</Card.Title>
				<p class="text-muted-foreground mt-1 text-sm">{i18n.t('workouts.week.editor.lede')}</p>
			</Card.Header>
			<Card.Content>
				<div class="space-y-5">
					{#if error}
						<p class="text-destructive text-sm" role="alert">{error}</p>
					{/if}
					<fieldset>
						<legend class="mb-2 text-sm font-medium">{i18n.t('workouts.week.howmany')}</legend>
						<div class="flex flex-wrap gap-1.5">
							{#each [1, 2, 3, 4, 5, 6, 7] as n (n)}
								<Button
									variant={shown.length === n ? 'default' : 'outline'}
									size="sm"
									disabled={busy}
									aria-label={i18n.tf('workouts.week.ndays', n)}
									onclick={() => preview({ days: n, planId: source || undefined })}
								>
									{n}
								</Button>
							{/each}
						</div>
					</fieldset>
					<fieldset>
						<legend class="mb-2 text-sm font-medium">{i18n.t('workouts.week.which')}</legend>
						<div class="flex flex-wrap gap-x-4 gap-y-2">
							{#each WEEKDAYS as wd (wd)}
								<div class="flex items-center gap-2">
									<Checkbox
										id="week-{wd}"
										checked={chosen.includes(wd)}
										disabled={isClosed({ ...week, days: shown }, wd, today)}
										onCheckedChange={(v) => toggle(wd, v)}
									/>
									<Label for="week-{wd}">{weekdayShort(i18n, wd)}</Label>
								</div>
							{/each}
						</div>
					</fieldset>
					{#if plans.length > 1}
						<div>
							<Label for="week-plan">{i18n.t('workouts.week.source')}</Label>
							<div class="mt-2">
								<Select.Root
									type="single"
									value={source}
									items={plans.map((p) => ({ value: p.id, label: `${p.name} · ${i18n.tf('workouts.week.ndays', p.days.length)}` }))}
									onValueChange={(v) => {
										source = v;
										void preview(formRequest());
									}}
								>
									<Select.Trigger id="week-plan"><Select.Value /></Select.Trigger>
									<Select.Content>
										{#each plans as p (p.id)}
											<Select.Item value={p.id} label="{p.name} · {i18n.tf('workouts.week.ndays', p.days.length)}">
												{p.name} · {i18n.tf('workouts.week.ndays', p.days.length)}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						</div>
					{/if}
					{#if matching.length > 0}
						<div class="border-hairline rounded-lg border px-3 py-2.5 text-sm">
							{#each matching as p (p.id)}
								<div class="flex flex-wrap items-center justify-between gap-2">
									<span>
										<span class="font-medium">{p.name}</span>
										<span class="text-muted-foreground">{i18n.tf('workouts.week.builtfor', p.days.length)}</span>
									</span>
									<Button
										variant="outline"
										size="sm"
										disabled={busy}
										onclick={() => preview({ planId: p.id, days: p.days.length })}
									>
										{i18n.t('workouts.week.useit')}
									</Button>
								</div>
							{/each}
						</div>
					{/if}
					{#if shown.length > 0}
						<fieldset class="space-y-2">
							<legend class="mb-1 text-sm font-medium">{i18n.t('workouts.week.sessions')}</legend>
							{#each WEEKDAYS as wd (wd)}
								{@const d = shown.find((s) => s.weekday === wd)}
								{#if d}
									<div class="flex flex-wrap items-center gap-3">
										<span class="w-24 shrink-0 text-sm">{weekDate(i18n, d.date)}</span>
										{#if d.completed}
											<span class="text-sm">{d.focus}</span>
											<Badge variant="outline" class="border-signal/40 text-signal">{i18n.t('workouts.status.completed')}</Badge>
										{:else}
											{@const nextLabel = `${i18n.t('workouts.week.nextinplan')} · ${d.focus}`}
											<div class="min-w-0 flex-1">
												<Select.Root
													type="single"
													value={pins[wd] || NEXT}
													items={[{ value: NEXT, label: nextLabel }, ...sessions]}
													onValueChange={(v) => {
														pins = { ...pins, [wd]: v === NEXT ? '' : v };
														void preview(formRequest());
													}}
												>
													<Select.Trigger id="week-session-{wd}" aria-label={weekDate(i18n, d.date)}><Select.Value /></Select.Trigger>
													<Select.Content>
														<Select.Item value={NEXT} label={nextLabel}>{nextLabel}</Select.Item>
														{#each sessions as o (o.value)}
															<Select.Item value={o.value} label={o.label}>{o.label}</Select.Item>
														{/each}
													</Select.Content>
												</Select.Root>
											</div>
										{/if}
									</div>
								{/if}
							{/each}
						</fieldset>
					{/if}
					<div class="flex flex-wrap gap-2">
						<Button size="sm" disabled={busy} onclick={save}>{weekText(i18n, 'workouts.week.save', nextWeek)}</Button>
						<Button variant="ghost" size="sm" disabled={busy} onclick={() => showWeek(nextWeek)}>
							{i18n.t('workouts.cancel')}
						</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</section>
{/if}
