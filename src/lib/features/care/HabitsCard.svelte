<!-- Habits with streaks, today's tick, and the add form (Go: habitsCard, habitRow). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import ActionButton from './ActionButton.svelte';
	import DayChecks from './DayChecks.svelte';
	import { domainLabel, domains, habitSchedule, habitStreak, type CareHabit } from './format.js';
	import { careSubmit, dayChecked, typed, type CareFailure } from './forms.js';

	let { habits, failure }: { habits: CareHabit[]; failure: CareFailure | null } = $props();
	const i18n = useI18n();

	const errors = $derived(failure?.errors ?? {});
	let resetKey = $state(0);
</script>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('care.habits.title')}</Card.Title>
		<Card.Description>{i18n.t('care.habits.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if habits.length > 0}
			<ul class="mb-6 space-y-2">
				{#each habits as s (s.id)}
					<li class="border-hairline flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<span class="text-sm font-medium">{s.name}</span>
								<Badge variant="secondary">{domainLabel(i18n, s.domain)}</Badge>
								{#if s.streak > 0}
									<span class="text-signal font-mono text-[10px] uppercase tracking-[0.14em]">
										{habitStreak(i18n, s.streak)}
									</span>
								{/if}
							</div>
							<p class="text-muted-foreground mt-0.5 text-xs">
								{habitSchedule(i18n, s.daysOfWeek)}
								{#if s.scheduled > 0}
									· {i18n.tf('care.habits.kept', s.kept, s.scheduled)}
								{/if}
							</p>
						</div>
						<div class="flex shrink-0 items-center gap-2">
							{#if s.scheduledToday}
								<!-- Sends the state it wants, not a flip (Go: doneValue). -->
								{#if s.doneToday}
									<ActionButton action="?/habitDone" fields={{ id: s.id, done: 'false' }} variant="outline">
										{i18n.t('care.habits.done')}
									</ActionButton>
								{:else}
									<ActionButton
										action="?/habitDone"
										fields={{ id: s.id, done: 'true' }}
										class="bg-signal text-background hover:bg-signal/90"
									>
										{i18n.t('care.habits.markdone')}
									</ActionButton>
								{/if}
							{:else}
								<!-- Not due today is not the same as missed, and should not read like a failure. -->
								<span class="text-muted-foreground text-xs">{i18n.t('care.habits.nottoday')}</span>
							{/if}
							<ActionButton action="?/habitDelete" fields={{ id: s.id }} variant="ghost">
								{i18n.t('care.habits.delete')}
							</ActionButton>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
		{#key resetKey}
			<form method="post" action="?/habit" class="space-y-4" use:enhance={careSubmit(() => resetKey++)}>
				<div class="flex flex-wrap gap-4">
					<div class="space-y-2">
						<Label for="name">{i18n.t('care.habits.new')}</Label>
						<Input
							id="name"
							name="name"
							value={typed(failure, 'name')}
							placeholder={i18n.t('care.habits.new.ph')}
							aria-invalid={errors.name ? 'true' : undefined}
						/>
					</div>
					<div class="space-y-2">
						<Label for="domain">{i18n.t('care.habits.area')}</Label>
						<Select.Root type="single" name="domain" value={typed(failure, 'domain') || undefined}>
							<Select.Trigger id="domain">
								<Select.Value placeholder={i18n.t('lifedomain.personal')} />
							</Select.Trigger>
							<Select.Content>
								{#each domains as d (d)}
									<Select.Item value={d} label={i18n.t('lifedomain.' + d)}>{i18n.t('lifedomain.' + d)}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				{#if errors.name}
					<p class="text-[0.8rem] font-medium text-red-500">{errors.name}</p>
				{/if}
				<div>
					<Label>{i18n.t('care.habits.days')}</Label>
					<DayChecks idPrefix="habit-day" checked={(d) => dayChecked(failure, d)} />
					{#if errors.days}
						<p class="mt-2 text-[0.8rem] font-medium text-red-500">{errors.days}</p>
					{/if}
				</div>
				<Button type="submit" class="bg-signal text-background hover:bg-signal/90">{i18n.t('care.habits.add')}</Button>
			</form>
		{/key}
	</Card.Content>
</Card.Root>
