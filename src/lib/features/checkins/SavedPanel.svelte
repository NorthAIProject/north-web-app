<!--
	The receipt that replaces the wizard once the check-in is stored (Go
	SavedPanel). When the save earned a moment the card comes first. The
	coach's note is fetched after the panel lands, so the receipt never waits
	on the model; an empty answer just removes the placeholder.
-->
<script lang="ts">
	import Moment from '#lib/components/khepri/Moment.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import {
		checkinLabel,
		dayStateLabel,
		dotClass,
		restsHeld,
		runLine,
		type CheckIn,
		type Moment as MomentData,
		type Run
	} from './checkins.js';

	type Reply = { kind: string; text: string };

	let {
		checkIn,
		run,
		moment,
		reply,
		onedit
	}: {
		checkIn: CheckIn;
		run: Run;
		moment?: MomentData;
		/** Loads the coach's note; only for today's check-in. */
		reply?: () => Promise<Reply | null>;
		onedit: () => void;
	} = $props();

	const i18n = useI18n();
	let note = $state<Reply | null | undefined>(undefined);

	$effect(() => {
		if (!reply) return;
		let cancelled = false;
		reply()
			.then((r) => {
				if (!cancelled) note = r;
			})
			// The note is decoration: a failure shows nothing.
			.catch(() => {
				if (!cancelled) note = null;
			});
		return () => {
			cancelled = true;
		};
	});
</script>

<div class="space-y-8" data-checkin-saved>
	{#if moment}
		<Moment {moment} />
	{/if}
	<Card.Root class="border-signal/30 bg-signal/5">
		<Card.Content>
			<p class="text-signal font-mono text-[10px] uppercase tracking-[0.14em]">{i18n.t('checkins.logged')}</p>
			<p class="mt-2 text-lg font-medium tracking-tight">{checkinLabel(i18n, checkIn)}</p>
			{#if checkIn.relatedGoalTitle}
				<p class="text-muted-foreground mt-1 text-sm">{i18n.tf('checkins.related', checkIn.relatedGoalTitle)}</p>
			{/if}
			{#if run.current > 0}
				<p class="text-muted-foreground mt-1 text-sm">{runLine(i18n, run)}</p>
			{/if}
			{#if run.restsHeld > 0}
				<p class="text-muted-foreground mt-1 text-xs">{restsHeld(i18n, run.restsHeld)}</p>
			{/if}
			{#if run.week.length > 0}
				<!-- Monday to Sunday. A past day without a check-in is never labelled missed. -->
				<div class="mt-4">
					<ol class="flex gap-2" aria-label={i18n.t('checkins.week.label')}>
						{#each run.week as d (d.date)}
							<li
								data-day-state={d.state}
								class={['size-3 rounded-full', dotClass(d.state, run.perfectWeek)]}
								aria-label="{formatTime(i18n.locale, d.date, 'Mon', 'UTC')}: {dayStateLabel(i18n, d.state)}"
							></li>
						{/each}
					</ol>
					{#if run.perfectWeek}
						<p class="text-ember mt-2 font-mono text-[10px] uppercase tracking-[0.14em]">
							{i18n.t('checkins.week.perfect')}
						</p>
					{/if}
				</div>
			{/if}
			<div class="mt-5 flex flex-col gap-2 sm:flex-row">
				<Button class="min-h-11 flex-1" onclick={onedit}>{i18n.t('checkins.edit')}</Button>
				<Button href="/app" variant="outline" class="min-h-11 flex-1">{i18n.t('checkins.back')}</Button>
			</div>
		</Card.Content>
	</Card.Root>
	{#if reply}
		{#if note === undefined}
			<Skeleton class="h-14 w-full rounded-lg" />
		{:else if note && note.text}
			<div class="border-border bg-muted/40 rounded-lg border px-4 py-3" data-checkin-reply>
				{#if note.kind === 'pattern'}
					<p class="text-signal font-mono text-[10px] uppercase tracking-[0.14em]">{i18n.t('checkins.reply.pattern')}</p>
				{/if}
				<p class="mt-1 text-sm">{note.text}</p>
			</div>
		{/if}
	{/if}
</div>
