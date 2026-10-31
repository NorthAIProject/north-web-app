<!--
	The grid of day cards (web/day cards.templ). Each card is a tile that
	opens its detail dialog; the writes in the dialogs post to My Day's
	named actions.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import DropletIcon from '@lucide/svelte/icons/droplet';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import LeafIcon from '@lucide/svelte/icons/leaf';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import TimerIcon from '@lucide/svelte/icons/timer';
	import UtensilsIcon from '@lucide/svelte/icons/utensils';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import DayCard from './DayCard.svelte';
	import Hypnogram from './Hypnogram.svelte';
	import StreakLive from './StreakLive.svelte';
	import Swatch from './Swatch.svelte';
	import WaterOtherForm from './WaterOtherForm.svelte';
	import { quickSubmit } from './forms.js';
	import { fastMeta, fillY, missingNames, ringDash, type DayView } from './view.js';

	let { data, timeZone }: { data: DayView; timeZone: string } = $props();
	const i18n = useI18n();

	const f = $derived(data.food);
	const w = $derived(data.water);
	const a = $derived(data.activity);
	const s = $derived(data.sleep);
	const wo = $derived(data.workouts);
	const fast = $derived(data.fast);
	const n = $derived(data.nutrients);
</script>

<section class="grid grid-cols-2 gap-3 sm:gap-4" aria-label={i18n.t('day.cards')}>
	<!-- Fast -->
	<DayCard id="fast" titleKey="day.card.fast" color="var(--color-day-fat)" icon={TimerIcon} meta={fastMeta(i18n, fast)}>
		<span class="flex w-full items-center justify-center">
			{#if fast.shown}
				<span class="relative flex size-24 items-center justify-center">
					<svg viewBox="0 0 80 80" class="absolute inset-0 size-24" aria-hidden="true">
						<circle cx="40" cy="40" r="33" fill="none" stroke="var(--color-day-fat)" stroke-opacity="0.18" stroke-width="7"></circle>
						<circle cx="40" cy="40" r="33" fill="none" stroke="var(--color-day-fat)" stroke-width="7" stroke-linecap="round" pathLength="100" stroke-dasharray={ringDash(fast.fraction)} transform="rotate(-90 40 40)"></circle>
					</svg>
					<span class="text-xl font-semibold tabular-nums">{fast.elapsed}</span>
				</span>
			{:else}
				<span class="text-muted-foreground text-sm">{i18n.t('day.fast.none')}</span>
			{/if}
		</span>
		{#snippet detail(close)}
			{#if fast.shown}
				<dl class="grid grid-cols-2 gap-y-2 text-sm tabular-nums">
					<dt class="text-muted-foreground">{i18n.t('day.fast.elapsed')}</dt>
					<dd class="text-right font-medium">{fast.elapsed}</dd>
					<dt class="text-muted-foreground">{i18n.t('day.fast.target')}</dt>
					<dd class="text-right">{fast.target}h</dd>
					<dt class="text-muted-foreground">{i18n.t('day.fast.started')}</dt>
					<dd class="text-right">{fast.started}</dd>
					<dt class="text-muted-foreground">{i18n.t('day.fast.phase')}</dt>
					<dd class="text-right">{i18n.t(`day.fast.phase.${fast.phase}`)}</dd>
				</dl>
			{/if}
			{#if fast.active}
				<form method="post" action="?/fastStop" use:enhance={quickSubmit(i18n, close)}>
					<Button type="submit" variant="outline">{i18n.t('day.fast.stop')}</Button>
				</form>
			{:else}
				<form method="post" action="?/fastStart" class="flex flex-wrap gap-2" use:enhance={quickSubmit(i18n, close)}>
					{#each ['12', '16', '18', '24'] as h (h)}
						<Button type="submit" variant="outline" name="target_hours" value={h}>{i18n.t('day.fast.start')} {h}h</Button>
					{/each}
				</form>
			{/if}
		{/snippet}
	</DayCard>

	<!-- Food -->
	<DayCard id="food" titleKey="day.card.food" color="var(--color-day-food)" icon={UtensilsIcon} meta="{f.calories} kcal">
		<span class="flex w-full items-center justify-between gap-3">
			<svg viewBox="0 0 80 80" class="size-16 shrink-0 sm:size-20" aria-hidden="true">
				{#each f.macros as m (m.key)}
					<circle cx="40" cy="40" r={m.radius} fill="none" stroke={m.color} stroke-opacity="0.18" stroke-width="7"></circle>
					<circle cx="40" cy="40" r={m.radius} fill="none" stroke={m.color} stroke-width="7" stroke-linecap="round" pathLength="100" stroke-dasharray={ringDash(m.fraction)} transform="rotate(-90 40 40)"></circle>
				{/each}
			</svg>
			<span class="space-y-1 text-right text-sm tabular-nums">
				{#each f.macros as m (m.key)}
					<span class="flex items-center justify-end gap-1.5">
						<Swatch color={m.color} />
						<span class="text-muted-foreground text-xs">{m.letter}</span>
						<span class="font-semibold">{m.grams}</span>
					</span>
				{/each}
			</span>
		</span>
		{#snippet detail()}
			<dl class="grid grid-cols-3 gap-y-2 text-sm tabular-nums">
				<dt class="text-muted-foreground">{i18n.t('day.food.energy')}</dt>
				<dd class="font-medium">{f.calories} kcal</dd>
				<dd class="text-muted-foreground text-right">{#if f.hasGoal}{f.goal} kcal{/if}</dd>
				{#each f.macros as m (m.key)}
					<dt class="text-muted-foreground">{i18n.t(`day.food.${m.key}`)}</dt>
					<dd class="flex items-center gap-1.5 font-medium"><Swatch color={m.color} />{m.grams} g</dd>
					<dd class="text-muted-foreground text-right">{#if f.hasGoal}{m.goal} g{/if}</dd>
				{/each}
			</dl>
			{#if !f.hasGoal}
				<p class="text-muted-foreground text-sm">{i18n.t('day.food.nogoal')}</p>
			{/if}
			<Button href="/app/nutrition/log" variant="outline">{i18n.t('day.food.log')}</Button>
		{/snippet}
	</DayCard>

	<!-- Water -->
	<DayCard id="water" titleKey="day.card.water" color="var(--color-day-water)" icon={DropletIcon}>
		<span class="flex w-full items-end justify-between gap-3">
			<span>
				<span class="block text-2xl font-semibold tabular-nums sm:text-3xl">{w.totalMl}</span>
				<span class="text-muted-foreground text-xs">{i18n.t('day.water.today')}</span>
			</span>
			<svg viewBox="0 0 48 64" class="h-20 w-14 shrink-0" aria-hidden="true">
				<defs>
					<clipPath id="day-glass"><path d="M8 8 h32 l-4 50 a4 4 0 0 1 -4 4 h-16 a4 4 0 0 1 -4 -4 z"></path></clipPath>
				</defs>
				<path d="M8 8 h32 l-4 50 a4 4 0 0 1 -4 4 h-16 a4 4 0 0 1 -4 -4 z" fill="var(--color-day-water)" fill-opacity="0.12" stroke="var(--color-day-water)" stroke-opacity="0.4" stroke-width="1.5"></path>
				<rect x="0" y={fillY(w.fraction)} width="48" height="64" fill="var(--color-day-water)" clip-path="url(#day-glass)"></rect>
			</svg>
		</span>
		{#snippet detail(close)}
			<p class="text-sm tabular-nums">
				<span class="text-2xl font-semibold">{w.litres}</span>
				<span class="text-muted-foreground">/ {w.targetMl} ml</span>
			</p>
			<form method="post" action="?/water" class="flex flex-wrap gap-2" use:enhance={quickSubmit(i18n, close)}>
				{#each ['250', '500'] as ml (ml)}
					<Button type="submit" variant="outline" name="amount_ml" value={ml}>+{ml} ml</Button>
				{/each}
			</form>
			<WaterOtherForm testId="day-water-other" done={close} />
		{/snippet}
	</DayCard>

	<!-- Activity -->
	<DayCard id="activity" titleKey="day.card.activity" color="var(--color-day-move)" icon={ActivityIcon}>
		<span class="flex w-full items-center justify-between gap-3">
			<svg viewBox="0 0 80 80" class="size-16 shrink-0 sm:size-20" aria-hidden="true">
				{#each a.rings as r (r.key)}
					<circle cx="40" cy="40" r={r.radius} fill="none" stroke={r.color} stroke-opacity="0.18" stroke-width="8"></circle>
					<circle cx="40" cy="40" r={r.radius} fill="none" stroke={r.color} stroke-width="8" stroke-linecap="round" pathLength="100" stroke-dasharray={ringDash(r.fraction)} transform="rotate(-90 40 40)"></circle>
				{/each}
			</svg>
			<!-- The unit names each ring's value (kcal move, min exercise, h
				stand), so the number does not lean on the swatch's colour alone. -->
			<span class="space-y-1 text-right text-sm tabular-nums">
				{#each a.rings as r (r.key)}
					<span class="flex items-center justify-end gap-1.5">
						<Swatch color={r.color} />
						<span class="font-semibold">{r.value}</span>
						<span class="text-muted-foreground text-xs">{r.unit}</span>
					</span>
				{/each}
			</span>
		</span>
		{#snippet detail()}
			<dl class="grid grid-cols-2 gap-y-2 text-sm tabular-nums">
				{#each a.rings as r (r.key)}
					<dt class="text-muted-foreground">{i18n.t(`day.activity.${r.key}`)}</dt>
					<dd class="flex items-center justify-end gap-1.5">
						<Swatch color={r.color} />
						<span class="font-medium">{r.value}</span>
						<span class="text-muted-foreground">/ {r.goal} {r.unit}</span>
					</dd>
				{/each}
			</dl>
		{/snippet}
	</DayCard>

	<!-- Sleep -->
	<DayCard id="sleep" titleKey="day.card.sleep" color="var(--color-day-sleep)" icon={MoonIcon} meta={s.quality}>
		<span class="w-full">
			{#if s.logged}
				<span class="block text-2xl font-semibold tabular-nums sm:text-3xl">
					{s.hours}<span class="text-muted-foreground text-sm font-normal">h</span>
					{s.minutes}<span class="text-muted-foreground text-sm font-normal">m</span>
				</span>
				{#if s.hasStages}<Hypnogram bars={s.bars} class="h-10" />{/if}
			{:else}
				<span class="text-muted-foreground text-sm">{i18n.t('day.sleep.none')}</span>
			{/if}
		</span>
		{#snippet detail()}
			{#if s.logged}
				<div>
					<p class="text-2xl font-semibold tabular-nums">{s.hours}h {s.minutes}m</p>
					{#if s.span}<p class="text-muted-foreground text-sm tabular-nums">{s.span}</p>{/if}
				</div>
				{#if s.hasStages}
					<Hypnogram bars={s.bars} class="h-16" />
					<dl class="grid grid-cols-2 gap-y-2 text-sm tabular-nums" data-testid="sleep-stages">
						{#each s.stages as st (st.key)}
							<dt class="flex items-center gap-2">
								<span class="size-2.5 rounded-full" style:background={st.color}></span>
								{i18n.t(`day.sleep.${st.key}`)}
							</dt>
							<dd class="text-muted-foreground text-right">{st.minutes} min</dd>
						{/each}
					</dl>
				{/if}
			{:else}
				<p class="text-muted-foreground text-sm">{i18n.t('day.sleep.none')}</p>
			{/if}
			<Button href="/app/care" variant="outline">{i18n.t('day.sleep.log')}</Button>
		{/snippet}
	</DayCard>

	<!-- Workouts -->
	<DayCard id="workouts" titleKey="day.card.workouts" color="var(--color-day-fat)" icon={DumbbellIcon} meta={String(wo.count)}>
		<span class="w-full">
			<span class="block text-2xl font-semibold tabular-nums sm:text-3xl">
				{wo.minutes}<span class="text-muted-foreground text-sm font-normal"> min</span>
			</span>
			{#if wo.labels.length > 0}
				<span class="text-muted-foreground mt-1 line-clamp-1 text-xs">{wo.labels.join(' · ')}</span>
			{/if}
		</span>
		{#snippet detail()}
			{#if wo.labels.length === 0}
				<p class="text-muted-foreground text-sm">{i18n.t('day.workouts.none')}</p>
			{:else}
				<ul class="space-y-1 text-sm">
					{#each wo.labels as l, i (i)}<li>{l}</li>{/each}
				</ul>
			{/if}
			<Button href="/app/fitness/activities" variant="outline">{i18n.t('day.workouts.log')}</Button>
		{/snippet}
	</DayCard>

	<!-- Nutrients -->
	<DayCard id="nutrients" titleKey="day.card.nutrients" color="var(--color-day-food)" icon={LeafIcon}>
		<span class="w-full">
			<span class="block text-3xl font-semibold tabular-nums">
				{n.covered}<span class="text-muted-foreground text-sm font-normal">/{n.total}</span>
			</span>
			{#if n.missing.length > 0}
				<span class="text-muted-foreground mt-1 line-clamp-2 text-xs">{missingNames(i18n, n.missing, 3)}</span>
			{/if}
		</span>
		{#snippet detail()}
			<p class="text-sm">{i18n.tf('day.nutrients.detail', n.covered, n.total)}</p>
			{#if n.missing.length > 0}
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{i18n.t('day.nutrients.missing')}</p>
				<ul class="flex flex-wrap gap-1.5">
					{#each n.missing as k (k)}
						<li class="bg-muted rounded-full px-2 py-0.5 text-xs">{i18n.t(`day.nutrient.${k}`)}</li>
					{/each}
				</ul>
			{/if}
		{/snippet}
	</DayCard>

	<!-- Streak -->
	<DayCard id="streak" titleKey="day.card.streak" color="var(--color-ember)" icon={FlameIcon} meta={i18n.tf('day.streak.level', data.level)}>
		<StreakLive tile={data.streakTile} {timeZone} />
		{#snippet detail()}
			<p class="text-sm">{i18n.tf('day.streak.detail', data.streakTile.streak)}</p>
			<Button href="/app/check-ins" variant="outline">{i18n.t('day.streak.checkin')}</Button>
		{/snippet}
	</DayCard>
</section>
