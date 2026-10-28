<!--
	Reviewing an imported training plan before it is saved (north-client
	planimport workout.templ WorkoutReviewPage). Go posted the whole draft back
	on every Remove; here the draft lives in the page, and only Save posts it.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { WorkoutDraft } from './types.js';
	import { WEEKDAYS } from './weekday.js';

	let { draft: initial, error = '' }: { draft: WorkoutDraft; error?: string } = $props();
	const i18n = useI18n();

	// svelte-ignore state_referenced_locally
	let draft: WorkoutDraft = $state(structuredClone(initial));
	let submitting = $state(false);

	const missingSets = $derived(draft.days.some((d) => d.exercises.some((e) => e.sets === undefined || e.sets === null)));
	// The values stay English: the server parses them. Only the picker is translated.
	const weekdayItems = $derived(
		WEEKDAYS.map((d, i) => ({ value: d, label: i18n.t(`weekday.long.${(i + 1) % 7}`) }))
	);

	const dayLabel = (label: string, i: number) => label || i18n.tf('planimport.workout.day', i + 1);
	const optInt = (n: number | undefined | null) => (n === undefined || n === null ? '' : String(n));

	/** A whole number, or undefined with the reason added to the row's flags (Go: formInt). */
	function whole(raw: string, flagKey: string, flags: string[]): number | undefined {
		const v = raw.trim();
		if (v === '') return undefined;
		const n = Number(v.replace(',', '.'));
		if (Number.isInteger(n)) return n;
		const flag = i18n.t(flagKey);
		if (!flags.includes(flag)) flags.push(flag);
		return undefined;
	}

	function removeDay(i: number) {
		draft.days.splice(i, 1);
	}

	function removeExercise(i: number, j: number) {
		draft.days[i].exercises.splice(j, 1);
		if (draft.days[i].exercises.length === 0) draft.days.splice(i, 1);
	}
</script>

<div class="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('planimport.label')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('planimport.workout.heading')}</h1>
		<p class="text-muted-foreground mt-1 text-sm">{i18n.t('planimport.workout.intro')}</p>
		{#if missingSets}
			<p class="text-muted-foreground mt-2 text-sm">{i18n.t('planimport.workout.no_sets')}</p>
		{/if}
	</header>
	{#if error}
		<Alert.Root variant="destructive">
			<Alert.Description>{error}</Alert.Description>
		</Alert.Root>
	{/if}
	<form
		method="post"
		action="/app/training/import/review"
		class="space-y-6"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update({ reset: false });
				submitting = false;
			};
		}}
	>
		<input type="hidden" name="draft" value={JSON.stringify(draft)} />
		<label class="block space-y-1">
			<span class="text-muted-foreground text-xs">{i18n.t('planimport.plan_name')}</span>
			<Input name="name" bind:value={draft.name} required />
		</label>
		{#if draft.unparsed.length > 0}
			<Alert.Root>
				<Alert.Title>{i18n.t('planimport.unparsed.title')}</Alert.Title>
				<Alert.Description>
					<p>{i18n.t('planimport.unparsed.body')}</p>
					<ul class="mt-2 list-disc space-y-0.5 pl-5">
						{#each draft.unparsed as line, i (i)}
							<li>&ldquo;{line}&rdquo;</li>
						{/each}
					</ul>
				</Alert.Description>
			</Alert.Root>
		{/if}
		{#each draft.days as day, i (day)}
			<Card.Root data-testid="import-day">
				<Card.Header class="flex flex-row flex-wrap items-center justify-between gap-3">
					<Card.Title>{dayLabel(day.label, i)}</Card.Title>
					<div class="flex items-center gap-2">
						<Select.Root type="single" bind:value={day.weekday} items={weekdayItems}>
							<Select.Trigger class="w-40" aria-invalid={day.weekday === '' ? true : undefined}>
								<Select.Value placeholder={i18n.t('planimport.weekday_ph')} />
							</Select.Trigger>
							<Select.Content>
								{#each weekdayItems as o (o.value)}
									<Select.Item value={o.value} label={o.label}>{o.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<Button variant="ghost" size="sm" onclick={() => removeDay(i)}>{i18n.t('planimport.remove_day')}</Button>
					</div>
				</Card.Header>
				<Card.Content>
					<div class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>{i18n.t('planimport.workout.col.exercise')}</Table.Head>
									<Table.Head>{i18n.t('planimport.workout.col.sets')}</Table.Head>
									<Table.Head>{i18n.t('planimport.workout.col.reps')}</Table.Head>
									<Table.Head>{i18n.t('planimport.workout.col.load')}</Table.Head>
									<Table.Head>{i18n.t('planimport.workout.col.rest')}</Table.Head>
									<Table.Head>{i18n.t('planimport.workout.col.notes')}</Table.Head>
									<Table.Head><span class="sr-only">{i18n.t('planimport.remove')}</span></Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each day.exercises as ex, j (ex)}
									<Table.Row>
										<Table.Cell class="min-w-40 align-top">
											<Input bind:value={ex.name} required aria-invalid={ex.name === '' ? true : undefined} />
											{#if ex.flags && ex.flags.length > 0}
												<div class="mt-1 flex flex-wrap gap-1">
													{#each ex.flags as flag, k (k)}
														<Badge variant="outline" class="whitespace-normal text-left">{flag}</Badge>
													{/each}
												</div>
											{/if}
										</Table.Cell>
										<Table.Cell class="align-top">
											<Input
												type="number"
												value={optInt(ex.sets)}
												class="w-16"
												placeholder="—"
												onchange={(e) => (ex.sets = whole(e.currentTarget.value, 'planimport.flag.sets.whole', (ex.flags ??= [])))}
											/>
										</Table.Cell>
										<Table.Cell class="align-top">
											<Input bind:value={ex.reps} class="w-20" placeholder="—" />
										</Table.Cell>
										<Table.Cell class="align-top">
											<Input bind:value={ex.load} class="w-24" placeholder="—" />
										</Table.Cell>
										<Table.Cell class="align-top">
											<Input
												type="number"
												value={optInt(ex.restSeconds)}
												class="w-20"
												placeholder="—"
												onchange={(e) =>
													(ex.restSeconds = whole(e.currentTarget.value, 'planimport.flag.rest.whole', (ex.flags ??= [])))}
											/>
										</Table.Cell>
										<Table.Cell class="min-w-40 align-top">
											<Input bind:value={ex.notes} placeholder="—" />
										</Table.Cell>
										<Table.Cell class="align-top">
											<Button
												variant="ghost"
												size="sm"
												aria-label={i18n.tf('planimport.remove_named', ex.name)}
												onclick={() => removeExercise(i, j)}
											>
												{i18n.t('planimport.remove')}
											</Button>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
		<div class="flex flex-wrap items-center justify-end gap-2">
			<Button href="/app/training" variant="ghost">{i18n.t('planimport.cancel_import')}</Button>
			<Button type="submit" disabled={submitting}>{i18n.t('planimport.save_plan')}</Button>
		</div>
	</form>
</div>
