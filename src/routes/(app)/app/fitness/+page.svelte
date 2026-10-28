<script lang="ts">
	import type { Snippet } from 'svelte';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import FootprintsIcon from '@lucide/svelte/icons/footprints';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import MountainIcon from '@lucide/svelte/icons/mountain';
	import PersonStandingIcon from '@lucide/svelte/icons/person-standing';
	import TimerIcon from '@lucide/svelte/icons/timer';
	import UtensilsIcon from '@lucide/svelte/icons/utensils';
	import WavesIcon from '@lucide/svelte/icons/waves';
	import { pageTitle } from '#lib/brand.js';
	import EmptyState from '#lib/components/khepri/EmptyState.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import {
		activitiesHref,
		avgMinutesPerDay,
		barHeight,
		barLabel,
		clockLabel,
		compact,
		completedLine,
		dayLabel,
		deltaClass,
		exerciseCount,
		hoursMinutes,
		kg,
		latest,
		noticeText,
		oneDecimal,
		paceLabel,
		percentOf,
		perDay,
		recentDetail,
		recentIcon,
		recentRows,
		recentTitle,
		sessionsLabel,
		signed,
		trainingHref,
		vo2Band,
		weekdayName,
		weekSource,
		when,
		whole,
		type DayValue,
		type RecentIcon
	} from '#lib/features/fitness/hub.js';
	import { areaLine } from '#lib/features/viz/chartjs.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { descriptionOf, groupLabel, labelOf } from '#lib/nav/nav.js';
	import { destinations } from '#lib/nav/destinations.js';
	import type { PageProps } from './$types';

	// Go: web/fitness/fitness.templ (Hub).

	let { data }: PageProps = $props();
	const i18n = useI18n();

	const hub = $derived(data.hub);
	const now = $derived(new Date(data.now));
	const timeZone = $derived(data.user.timezone || 'UTC');
	const notice = $derived(noticeText(data.notice));
	const hasPlan = $derived(Boolean(hub.planId));
	const signal = 'bg-signal text-background hover:bg-signal/90';

	// The Body pages the rail does not carry; the 3D view is offered by the
	// Strava card in the state where it has something to show.
	const tiles = destinations.filter(
		(d) => d.group === 'Body' && !d.nav?.show && d.href !== '/app/fitness/activities'
	);

	const recentIcons: Record<RecentIcon, typeof ActivityIcon> = {
		footprints: FootprintsIcon,
		'person-standing': PersonStandingIcon,
		bike: BikeIcon,
		waves: WavesIcon,
		mountain: MountainIcon,
		dumbbell: DumbbellIcon,
		heart: HeartIcon,
		activity: ActivityIcon
	};

	const syncStamp = (t: string) => formatTime(i18n.locale, t, '2 Jan, 15:04', timeZone);
	const trendLabels = (days: DayValue[]) => days.map((d) => dayLabel(i18n, d.date));
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.fitness'))}</title></svelte:head>

<!-- The hub's card: one surface and padding for every section. -->
{#snippet panel(children: Snippet)}
	<Card.Root class="gap-0 overflow-hidden border-hairline bg-surface py-0">
		{@render children()}
	</Card.Root>
{/snippet}

{#snippet panelHeading(label: string, extra?: Snippet)}
	<div class="flex items-center justify-between px-5 pt-5">
		<MonoLabel text={label} />
		{@render extra?.()}
	</div>
{/snippet}

{#snippet weekStat(value: string, unit: string, sub: string)}
	<div>
		<p class="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
		<p class="mt-0.5 text-xs text-muted-foreground">{unit}</p>
		{#if sub}
			<p class="text-[11px] text-muted-foreground/80">{sub}</p>
		{/if}
	</div>
{/snippet}

{#snippet miniStat(value: string, unit: string, label: string)}
	<div>
		<p class="text-xl font-semibold tracking-tight tabular-nums">
			{value}
			{#if unit}
				<span class="text-xs font-normal text-muted-foreground">{unit}</span>
			{/if}
		</p>
		<p class="text-[11px] text-muted-foreground">{label}</p>
	</div>
{/snippet}

{#snippet trendAxis(left: string, middle: string, right: string)}
	<div class="flex justify-between px-5 pt-1 pb-3 text-[11px] text-muted-foreground tabular-nums">
		<span>{left}</span>
		<span>{middle}</span>
		<span>{right}</span>
	</div>
{/snippet}

{#snippet macroStat(label: string, logged: number, goal: number)}
	<div class="rounded-md bg-muted/50 px-2 py-2">
		<p class="text-sm font-medium tabular-nums">
			{whole(logged)}<span class="text-[11px] text-muted-foreground">/{whole(goal)}g</span>
		</p>
		<p class="text-[11px] text-muted-foreground">{label}</p>
	</div>
{/snippet}

{#snippet weekCard()}
	{@const week = hub.week}
	{#snippet body()}
		{@render panelHeading(i18n.t('fitness.week.label'))}
		<div class="grid grid-cols-3 gap-2 px-5 pt-4 text-center">
			{@render weekStat(
				whole(week.minutes),
				i18n.t('fitness.week.active'),
				i18n.tf('fitness.week.perday', avgMinutesPerDay(week))
			)}
			{@render weekStat(compact(i18n, week.calories), i18n.t('fitness.week.burned'), '')}
			{@render weekStat(
				oneDecimal(i18n, week.distanceKm),
				'km',
				sessionsLabel(i18n, week.sessions)
			)}
		</div>
		<!-- Hand-rolled bars: seven proportional divs need no chart library. -->
		<div
			class="px-5 pt-6 pb-5"
			role="img"
			aria-label={i18n.tf('fitness.week.aria', whole(week.minutes))}
		>
			<div class="flex h-24 items-end gap-2">
				{#each week.days as b (b.date)}
					<div
						class="flex h-full flex-1 items-end"
						title={i18n.tf('fitness.week.bar', barLabel(i18n, b.date), whole(b.minutes))}
					>
						<div
							class={[
								'w-full rounded-md transition-colors',
								b.minutes > 0 ? 'bg-signal' : 'bg-muted'
							]}
							style="height: {barHeight(week, b.minutes)}"
						></div>
					</div>
				{/each}
			</div>
			<div class="mt-2 flex gap-2">
				{#each week.days as b (b.date)}
					<div class="flex flex-1 flex-col items-center gap-1">
						<span
							class={[
								'text-[11px]',
								b.isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'
							]}
						>
							{barLabel(i18n, b.date)}
						</span>
						<span class={['size-1 rounded-full', b.isToday && 'bg-signal']}></span>
					</div>
				{/each}
			</div>
		</div>
		<a
			href={activitiesHref(hub)}
			class="flex items-center justify-between border-t border-hairline px-5 py-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
		>
			<span>{weekSource(i18n, hub, now)}</span>
			<ChevronRightIcon class="size-4" />
		</a>
	{/snippet}
	{@render panel(body)}
{/snippet}

{#snippet strengthCard()}
	{@const v = hub.strength!}
	{#snippet all()}
		<a href="/app/insights/training" class="text-xs text-signal hover:underline"
			>{i18n.t('fitness.strength.all')}</a
		>
	{/snippet}
	{#snippet body()}
		{@render panelHeading(i18n.t('fitness.strength.label'), all)}
		<div class="space-y-4 px-5 pt-3 pb-5" data-testid="fitness-strength">
			<div class="grid grid-cols-3 gap-3">
				{@render miniStat(String(v.workouts), '', i18n.t('fitness.strength.workouts'))}
				{@render miniStat(String(v.sets), '', i18n.t('fitness.strength.sets'))}
				{@render miniStat(
					i18n.decimal(v.volumeKg / 1000, 1),
					't',
					i18n.t('fitness.strength.volume')
				)}
			</div>
			<ul class="divide-y divide-border text-sm">
				{#each v.exercises as e, i (i)}
					<li class="py-2">
						<div class="flex items-baseline justify-between gap-3">
							<span class="truncate font-medium">{e.name}</span>
							{#if e.changeKg > 0}
								<span class="shrink-0 text-xs text-signal tabular-nums"
									>+{kg(i18n, e.changeKg)}</span
								>
							{/if}
						</div>
						<p class="text-xs text-muted-foreground tabular-nums">
							{i18n.tf('fitness.strength.best', kg(i18n, e.bestKg), kg(i18n, e.e1rmKg))}
						</p>
					</li>
				{/each}
			</ul>
			{#if v.record}
				<div class="rounded-lg bg-signal/10 px-3 py-2 text-xs">
					<span class="font-semibold text-signal">{i18n.t('fitness.strength.record')}</span>
					· {v.record.exercise}
					{kg(i18n, v.record.weightKg)} × {v.record.reps}
					<span class="text-muted-foreground"
						>{i18n.tf(
							'fitness.strength.est',
							kg(i18n, v.record.e1rmKg),
							dayLabel(i18n, v.record.on)
						)}</span
					>
				</div>
			{/if}
		</div>
	{/snippet}
	{@render panel(body)}
{/snippet}

{#snippet cardioCard()}
	{@const v = hub.cardio!}
	{#snippet all()}
		<a href="/app/insights/cardio" class="text-xs text-signal hover:underline"
			>{i18n.t('fitness.cardio.all')}</a
		>
	{/snippet}
	{#snippet body()}
		{@render panelHeading(i18n.t('fitness.cardio.label'), all)}
		<div class="space-y-4 px-5 pt-3 pb-5" data-testid="fitness-cardio">
			<div class="grid grid-cols-3 gap-3">
				{@render miniStat(String(v.sessions), '', i18n.t('fitness.cardio.sessions'))}
				{#if v.distanceKm > 0}
					{@render miniStat(i18n.decimal(v.distanceKm, 1), 'km', i18n.t('fitness.cardio.distance'))}
				{:else}
					{@render miniStat(String(v.runs), '', i18n.t('fitness.cardio.runs'))}
				{/if}
				{@render miniStat(hoursMinutes(v.minutes), '', i18n.t('fitness.cardio.moving'))}
			</div>
			<dl class="divide-y divide-border text-sm">
				{#if v.runs > 0 && v.longestKm > 0}
					<div class="flex justify-between py-2">
						<dt class="text-muted-foreground">{i18n.t('fitness.cardio.longest')}</dt>
						<dd class="tabular-nums">{i18n.decimal(v.longestKm, 1) + ' km'}</dd>
					</div>
				{/if}
				{#if v.bestPaceSeconds > 0}
					<div class="flex justify-between py-2">
						<dt class="text-muted-foreground">{i18n.t('fitness.cardio.pace')}</dt>
						<dd class="tabular-nums">{paceLabel(v.bestPaceSeconds)}</dd>
					</div>
				{/if}
				{#if v.best5kSeconds > 0}
					<div class="flex justify-between py-2">
						<dt class="text-muted-foreground">{i18n.t('fitness.cardio.best5k')}</dt>
						<dd class="tabular-nums">{clockLabel(v.best5kSeconds)}</dd>
					</div>
				{/if}
				{#if v.restingHr > 0}
					<div class="flex justify-between py-2">
						<dt class="text-muted-foreground">{i18n.t('fitness.cardio.resthr')}</dt>
						<dd class="tabular-nums">{whole(v.restingHr)} bpm</dd>
					</div>
				{/if}
			</dl>
		</div>
	{/snippet}
	{@render panel(body)}
{/snippet}

{#snippet recentCard()}
	{#snippet all()}
		{#if hub.recent.length > 0}
			<a href={activitiesHref(hub)} class="text-xs text-muted-foreground hover:text-foreground"
				>{i18n.t('fitness.recent.all')}</a
			>
		{/if}
	{/snippet}
	{#snippet body()}
		{@render panelHeading(i18n.t('fitness.recent.label'), all)}
		{#if hub.recent.length === 0}
			<EmptyState
				title={i18n.t('fitness.recent.empty.title')}
				body={i18n.t('fitness.recent.empty.body')}
				class="py-8"
			>
				<Button href="/app/activity" variant="outline" size="sm"
					>{i18n.t('fitness.recent.start')}</Button
				>
			</EmptyState>
		{:else}
			<ul class="mt-2 divide-y divide-hairline">
				{#each hub.recent as r, i (i)}
					{@const Icon = recentIcons[recentIcon(r)]}
					<li class="flex items-center gap-3 px-5 py-3.5">
						<span
							class="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
						>
							<Icon class="size-4" />
						</span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{recentTitle(i18n, r)}</p>
							<p class="truncate text-xs text-muted-foreground tabular-nums">
								{recentDetail(i18n, r)}
							</p>
						</div>
						<time class="shrink-0 text-xs text-muted-foreground tabular-nums" datetime={r.endedAt}>
							{when(i18n, r.endedAt, timeZone)}
						</time>
					</li>
				{/each}
			</ul>
		{/if}
	{/snippet}
	{@render panel(body)}
{/snippet}

{#snippet bodyCard()}
	{#snippet body()}
		<div class="flex items-start justify-between gap-4 p-5">
			<div>
				<MonoLabel text={i18n.t('fitness.weight.label')} />
				{#if hub.weight}
					<p class="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
						{oneDecimal(i18n, hub.weight.kg)}
						<span class="text-sm font-normal text-muted-foreground">kg</span>
					</p>
					<p class="mt-0.5 text-xs text-muted-foreground">
						{#if hub.weight.deltaKg !== undefined}
							{i18n.tf('fitness.weight.since', signed(i18n, hub.weight.deltaKg, 1))}
						{/if}
						{formatTime(i18n.locale, hub.weight.at, '2 Jan', timeZone)}
					</p>
				{:else}
					<p class="mt-2 text-sm text-muted-foreground">{i18n.t('fitness.weight.none')}</p>
				{/if}
			</div>
			<a href="/app/calculator" class="shrink-0 text-xs text-signal hover:underline"
				>{i18n.t('fitness.weight.log')}</a
			>
		</div>
	{/snippet}
	{@render panel(body)}
{/snippet}

{#snippet stepsCard()}
	{@const days = hub.steps}
	{@const top = latest(days)}
	{#snippet body()}
		{@render panelHeading(i18n.t('fitness.steps.label'))}
		<div class="flex items-end justify-between gap-4 px-5 pt-3">
			<p class="text-3xl font-semibold tracking-tight tabular-nums">
				{compact(i18n, top.value)}
				<span class="text-sm font-normal text-muted-foreground">{i18n.t('fitness.steps.unit')}</span
				>
			</p>
			<div class="text-right text-xs text-muted-foreground tabular-nums">
				<p>{i18n.tf('fitness.week.perday', compact(i18n, perDay(days)))}</p>
				<p>{dayLabel(i18n, top.date)}</p>
			</div>
		</div>
		<div class="px-3 pt-3">
			<SpecChart
				{...areaLine(
					'fitness-steps',
					trendLabels(days),
					days.map((d) => d.value),
					'var(--north-signal)'
				)}
			/>
		</div>
		{@render trendAxis(
			dayLabel(i18n, days[0].date),
			i18n.tf('fitness.steps.days', days.length),
			dayLabel(i18n, days[days.length - 1].date)
		)}
		<ul
			class="mx-5 mb-5 divide-y divide-hairline overflow-hidden rounded-lg border border-hairline"
		>
			{#each recentRows(days, 5) as row (row.date)}
				<li class="flex items-center justify-between px-3 py-2.5">
					<div>
						<p class="text-sm font-medium tabular-nums">
							{i18n.tf('fitness.steps.row', compact(i18n, row.value))}
						</p>
						<p class="text-[11px] text-muted-foreground">{dayLabel(i18n, row.date)}</p>
					</div>
					{#if row.hasDelta}
						<span class={['text-xs tabular-nums', deltaClass(row.delta)]}
							>{signed(i18n, row.delta, 0)}</span
						>
					{/if}
				</li>
			{/each}
		</ul>
	{/snippet}
	{@render panel(body)}
{/snippet}

{#snippet vo2Card()}
	{@const days = hub.vo2}
	{@const top = latest(days)}
	{#snippet body()}
		{@render panelHeading(i18n.t('fitness.vo2.label'))}
		<div class="flex items-end justify-between gap-4 px-5 pt-3">
			<p class="text-3xl font-semibold tracking-tight tabular-nums">
				{oneDecimal(i18n, top.value)}
				<span class="text-sm font-normal text-muted-foreground">ml/kg/min</span>
			</p>
			<div class="text-right text-xs tabular-nums">
				<p class="text-ember">{vo2Band(i18n, top.value)}</p>
				<p class="text-muted-foreground">{dayLabel(i18n, top.date)}</p>
			</div>
		</div>
		<div class="px-3 pt-3">
			<SpecChart
				{...areaLine(
					'fitness-vo2',
					trendLabels(days),
					days.map((d) => d.value),
					'var(--north-agent)'
				)}
			/>
		</div>
		<div class="pb-4">
			{@render trendAxis(
				dayLabel(i18n, days[0].date),
				i18n.tf('fitness.vo2.readings', days.length),
				dayLabel(i18n, days[days.length - 1].date)
			)}
		</div>
	{/snippet}
	{@render panel(body)}
{/snippet}

{#snippet upNextCard()}
	{#snippet body()}
		<div class="p-5">
			<MonoLabel text={i18n.t('fitness.next.label')} />
			{#if hub.doneToday}
				<!-- So "Up next" pointing at Friday does not read as today skipped. -->
				<p class="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
					<CircleCheckIcon class="size-3.5 text-signal" />
					{completedLine(i18n, hub.doneToday)}
				</p>
			{/if}
			{#if hub.nextSession}
				{@const s = hub.nextSession}
				<p class="mt-2 text-lg font-semibold tracking-tight">
					{weekdayName(i18n, s.weekday).replace(/^./, (c) => c.toUpperCase())}
					{#if s.startTime}
						<span class="text-sm font-normal text-muted-foreground"
							>{i18n.tf('fitness.next.at', s.startTime)}</span
						>
					{/if}
				</p>
				{#if s.focus}
					<p class="text-sm text-muted-foreground">{s.focus}</p>
				{/if}
				<p class="mt-1 text-xs text-muted-foreground">{exerciseCount(i18n, s.exerciseCount)}</p>
				<div class="mt-4">
					<Button href={trainingHref(hub)} size="sm" class={['w-full', signal]}>
						<DumbbellIcon class="size-4" />
						{i18n.t('fitness.next.open')}
					</Button>
				</div>
			{:else if hasPlan}
				<p class="mt-2 text-sm">{i18n.t('fitness.next.noneleft')}</p>
				<div class="mt-4">
					<Button href={trainingHref(hub)} variant="outline" size="sm" class="w-full">
						{i18n.t('fitness.next.openplan')}
					</Button>
				</div>
			{:else}
				<p class="mt-2 text-sm">{i18n.t('fitness.next.noplan')}</p>
				<p class="text-xs text-muted-foreground">{i18n.t('fitness.next.generate')}</p>
				<div class="mt-4">
					<Button href="/app/training/new" variant="outline" size="sm" class="w-full">
						{i18n.t('fitness.next.build')}
					</Button>
				</div>
			{/if}
		</div>
	{/snippet}
	{@render panel(body)}
{/snippet}

{#snippet nutritionCard()}
	{#snippet body()}
		<div class="p-5">
			<div class="flex items-center justify-between">
				<MonoLabel text={i18n.t('fitness.food.label')} />
				<a href="/app/nutrition/log" class="text-xs text-signal hover:underline"
					>{i18n.t('fitness.hub.logfood')}</a
				>
			</div>
			{#if hub.meals}
				{@const p = hub.meals}
				<p class="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
					{whole(p.logged.calories)}
					<span class="text-sm font-normal text-muted-foreground"
						>/ {whole(p.goal.calories)} kcal</span
					>
				</p>
				<div class="mt-3">
					<Progress
						max={100}
						value={percentOf(p.logged.calories, p.goal.calories)}
						size="sm"
						label={i18n.t('fitness.food.progress')}
					/>
				</div>
				<div class="mt-4 grid grid-cols-3 gap-2 text-center">
					{@render macroStat(i18n.t('day.food.protein'), p.logged.proteinG, p.goal.proteinG)}
					{@render macroStat(i18n.t('day.food.carb'), p.logged.carbG, p.goal.carbG)}
					{@render macroStat(i18n.t('day.food.fat'), p.logged.fatG, p.goal.fatG)}
				</div>
			{:else}
				<p class="mt-2 text-sm text-muted-foreground">
					{i18n.t('fitness.food.nogoal1')}
					<a href="/app/calculator" class="text-foreground underline underline-offset-2"
						>{i18n.t('fitness.food.nogoal2')}</a
					>
					{i18n.t('fitness.food.nogoal3')}
				</p>
			{/if}
		</div>
	{/snippet}
	{@render panel(body)}
{/snippet}

{#snippet stravaCard()}
	{@const status = hub.strava}
	{#snippet body()}
		<div class="p-5">
			<MonoLabel text="Strava" />
			<p class="mt-2 text-sm">
				{#if !status.configured}
					{i18n.t('fitness.strava.unconfigured')}
				{:else if status.unavailable}
					{i18n.t('fitness.strava.unreadable')}
				{:else if status.connected}
					{i18n.t('fitness.strava.connected')}
					{#if status.syncPending}
						{i18n.t('fitness.strava.queued')}
					{:else if status.lastSyncedAt}
						{i18n.tf('fitness.strava.lastsynced', syncStamp(status.lastSyncedAt))}
					{:else if status.lastSyncAttemptedAt}
						{i18n.t('fitness.strava.noimports')}
					{:else}
						{i18n.t('fitness.strava.nosync')}
					{/if}
				{:else}
					{i18n.t('fitness.strava.pitch')}
				{/if}
			</p>
			<div class="mt-4">
				{#if !status.configured}
					<p class="text-xs leading-relaxed text-muted-foreground">
						{i18n.t('fitness.strava.envhint')}
					</p>
				{:else if status.unavailable}
					<!-- No Connect here: reconnecting to fix a read error would replace a working credential. -->
					<Alert.Root variant="destructive">
						<Alert.Title>{i18n.t('fitness.strava.unavail.title')}</Alert.Title>
						<Alert.Description>{i18n.t('fitness.strava.unavail.body')}</Alert.Description>
					</Alert.Root>
				{:else if status.connected}
					{#if status.lastSyncError}
						<div class="mb-4">
							<Alert.Root variant="destructive">
								<Alert.Title>{i18n.t('fitness.strava.failed')}</Alert.Title>
								<Alert.Description>
									<span class="block">{status.lastSyncError}</span>
									{#if status.lastSyncAttemptedAt}
										<span class="block text-xs opacity-80">
											{i18n.tf('fitness.strava.tried', syncStamp(status.lastSyncAttemptedAt))}
										</span>
									{/if}
								</Alert.Description>
							</Alert.Root>
						</div>
					{/if}
					{#if status.syncPending && !status.lastSyncedAt}
						<p class="mb-4 text-xs leading-relaxed text-muted-foreground">
							{i18n.t('fitness.strava.pending')} <code>task worker</code>.
						</p>
					{/if}
					<div class="flex flex-wrap gap-2">
						<Button href="/app/fitness/activities" class={signal}
							>{i18n.t('fitness.strava.view3d')}</Button
						>
						<form method="post" action="/app/fitness/strava/sync">
							<Button type="submit" variant="outline">{i18n.t('fitness.strava.sync')}</Button>
						</form>
						<form method="post" action="/app/fitness/strava/disconnect">
							<Button type="submit" variant="outline">{i18n.t('fitness.strava.disconnect')}</Button>
						</form>
					</div>
				{:else}
					<!-- A full navigation: the route leaves for Strava's consent page. -->
					<Button href="/app/fitness/strava/connect" data-sveltekit-reload class={signal}>
						{i18n.t('fitness.strava.connect')}
					</Button>
				{/if}
			</div>
		</div>
	{/snippet}
	{@render panel(body)}
{/snippet}

{#snippet exploreCard()}
	{#snippet body()}
		{@render panelHeading(i18n.t('fitness.explore.label'))}
		<ul class="mt-2 pb-2">
			{#each tiles as t (t.href)}
				<li>
					<a
						href={t.href}
						class="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-muted/50"
					>
						<span class="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
							<t.icon class="size-4" />
						</span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{labelOf(i18n, t)}</p>
							<p class="truncate text-xs text-muted-foreground">{descriptionOf(i18n, t)}</p>
						</div>
						<ChevronRightIcon class="size-4 shrink-0 text-muted-foreground" />
					</a>
				</li>
			{/each}
		</ul>
	{/snippet}
	{@render panel(body)}
{/snippet}

{#snippet deviceCard()}
	{#snippet body()}
		<div class="p-5">
			<MonoLabel text={i18n.t('fitness.device.label')} />
			<p class="mt-2 text-sm">
				{hub.deviceReadings.length > 0
					? i18n.t('fitness.device.some')
					: i18n.t('fitness.device.none')}
			</p>
			<div class="mt-3">
				{#if hub.deviceReadings.length > 0}
					<ul class="space-y-1.5">
						{#each hub.deviceReadings as line, i (i)}
							<li class="text-xs leading-relaxed text-muted-foreground">{line}</li>
						{/each}
					</ul>
				{:else}
					<p class="text-xs leading-relaxed text-muted-foreground">
						{i18n.t('fitness.device.howto')}
						<code class="rounded bg-muted px-1 py-0.5">/ingest/health/apple_health</code>.
					</p>
				{/if}
			</div>
		</div>
	{/snippet}
	{@render panel(body)}
{/snippet}

<div class="mx-auto w-full max-w-6xl p-4 md:p-8">
	<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
		<div>
			<MonoLabel text={groupLabel(i18n, 'Body')} />
			<h1 class="mt-2 text-2xl font-semibold tracking-tight">{i18n.t('nav.fitness')}</h1>
			<p class="mt-1 text-sm text-muted-foreground">{i18n.t('fitness.hub.lede')}</p>
		</div>
		<div class="flex gap-2">
			<Button href="/app/nutrition/log" variant="outline" size="sm">
				<UtensilsIcon class="size-4" />
				{i18n.t('fitness.hub.logfood')}
			</Button>
			<Button href="/app/activity" size="sm" class={signal}>
				<TimerIcon class="size-4" />
				{i18n.t('fitness.hub.track')}
			</Button>
		</div>
	</header>
	{#if notice}
		<div
			class="mb-6 rounded-lg border border-hairline bg-signal/10 px-4 py-3 text-sm"
			role="status"
		>
			{notice}
		</div>
	{/if}
	<div class="grid gap-6 lg:grid-cols-12">
		<div class="min-w-0 space-y-6 lg:col-span-8">
			{@render weekCard()}
			{#if hub.strength || hub.cardio}
				<div class="grid gap-6 md:grid-cols-2">
					{#if hub.strength}
						{@render strengthCard()}
					{/if}
					{#if hub.cardio}
						{@render cardioCard()}
					{/if}
				</div>
			{/if}
			{@render recentCard()}
			{@render bodyCard()}
			{#if hub.steps.length > 0}
				{@render stepsCard()}
			{/if}
			{#if hub.vo2.length > 0}
				{@render vo2Card()}
			{/if}
		</div>
		<aside class="min-w-0 space-y-6 lg:col-span-4">
			{@render upNextCard()}
			{@render nutritionCard()}
			{@render stravaCard()}
			{@render exploreCard()}
			{@render deviceCard()}
		</aside>
	</div>
</div>
