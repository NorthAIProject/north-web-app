<!--
	The meal plan review page (north-client web/planimport/meal.templ,
	MealReviewPage). One form posts the whole draft back on every button press;
	the pressed button's name=action says what it asked for.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import * as Select from '#lib/components/ui/select/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { tf } from '#lib/features/nutrition/view.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { options, type MealDraft } from './form.js';
	import type { MealReview } from './server.js';
	import {
		amount,
		anyOver,
		bandChoice,
		candidateListed,
		CARB_BANDS,
		dayLabel,
		foodField,
		gramsText,
		hasStatedMacros,
		ingredientValue,
		macroLine,
		MEAL_WEEKDAYS,
		optionName,
		say,
		stated
	} from './view.js';

	let { view }: { view: MealReview } = $props();
	const i18n = useI18n();

	const draft = $derived<MealDraft>(view.draft);
	const advanced = $derived(draft.mode === 'advanced');
	const draftJSON = $derived(JSON.stringify(draft));
	const weekdayName = (d: number) => i18n.t(`weekday.long.${d}`);

	const planTypeItems = $derived([
		...CARB_BANDS.map((b) => ({ value: b.type, label: bandChoice(i18n, b) })),
		...(advanced ? [{ value: 'custom', label: i18n.t('planimport.meal.custom') }] : [])
	]);
	const modeItems = $derived([
		{ value: 'easy', label: i18n.t('planimport.meal.easy') },
		{ value: 'advanced', label: i18n.t('planimport.meal.advanced') }
	]);
	const weekdayItems = $derived(MEAL_WEEKDAYS.map((d) => ({ value: String(d), label: weekdayName(d) })));

	let busy = $state(false);
</script>

{#snippet picker(name: string, items: { value: string; label: string }[], selected: string, placeholder: string, invalid: boolean, cls = '', search = false)}
	{#if search}
		<SearchSelect {name} value={selected} {items} {placeholder} {invalid} class={cls} />
	{:else}
	<Select.Root type="single" {name} value={selected} {items}>
		<Select.Trigger class={cls} aria-invalid={invalid ? true : undefined}>
			<Select.Value {placeholder} />
		</Select.Trigger>
		<Select.Content>
			{#each items as item (item.value)}
				<Select.Item value={item.value} label={item.label}>{item.label}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
	{/if}
{/snippet}

<div class="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('planimport.label')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('planimport.meal.heading')}</h1>
		<p class="text-muted-foreground mt-1 text-sm">{i18n.t('planimport.meal.intro')}</p>
	</header>
	{#if view.error}
		<Alert.Root variant="destructive">
			<Alert.Description>{say(i18n, view.error)}</Alert.Description>
		</Alert.Root>
	{/if}
	<form
		method="post"
		action="/app/nutrition/import/review"
		class="space-y-6"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
			};
		}}
	>
		<input type="hidden" name="draft" value={draftJSON} />
		<!-- The first submit button, so Enter in any field refreshes the review
		     instead of pressing the first Remove button (Go: defaultSubmit). -->
		<Button type="submit" class="sr-only" name="action" value="update" tabindex={-1} aria-hidden="true" formnovalidate>
			{i18n.t('planimport.update')}
		</Button>
		<Card.Root>
			<Card.Content class="grid gap-4 pt-6 sm:grid-cols-3">
				<label class="block space-y-1 sm:col-span-3">
					<span class="text-muted-foreground text-xs">{i18n.t('planimport.plan_name')}</span>
					<Input name="name" value={draft.name} required />
				</label>
				<div class="space-y-1">
					<span class="text-muted-foreground text-xs">{i18n.t('planimport.meal.mode')}</span>
					{@render picker('mode', modeItems, advanced ? 'advanced' : 'easy', '', false)}
				</div>
				<div class="space-y-1">
					<span class="text-muted-foreground text-xs">{i18n.t('planimport.meal.carb_type')}</span>
					{@render picker('plan_type', planTypeItems, draft.planType, i18n.t('planimport.meal.choose_one'), draft.planType === '')}
				</div>
				{#if draft.planType === 'custom'}
					<label class="block space-y-1">
						<span class="text-muted-foreground text-xs">{i18n.t('planimport.meal.custom_pct')}</span>
						<Input name="custom_carb_pct" type="number" value={gramsText(draft.customCarbPct)} />
					</label>
				{/if}
				<p class="text-muted-foreground text-xs sm:col-span-3">
					{#if draft.everyDay}
						{i18n.t('planimport.meal.every_day')}
					{:else if advanced}
						{i18n.t('planimport.meal.advanced_help')}
					{:else}
						{i18n.t('planimport.meal.easy_help')}
					{/if}
				</p>
				{#if !draft.hasTarget}
					<p class="text-destructive text-xs sm:col-span-3">
						{i18n.t('planimport.meal.no_target')}
						<a href="/app/calculator" class="underline">{i18n.t('planimport.meal.no_target.link')}</a>{i18n.t(
							'planimport.meal.no_target.after'
						)}
					</p>
				{/if}
			</Card.Content>
		</Card.Root>

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

		{#if draft.notes}
			<!-- The file's advice and recipes, saved with the plan as written. -->
			<Card.Root>
				<Collapsible.Root>
					<Collapsible.Trigger class="w-full cursor-pointer text-left">
						<Card.Header>
							<Card.Title>{i18n.t('planimport.meal.notes.title')}</Card.Title>
							<Card.Description>{i18n.t('planimport.meal.notes.body')}</Card.Description>
						</Card.Header>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<Card.Content>
							<p class="text-muted-foreground text-sm whitespace-pre-wrap">{draft.notes}</p>
						</Card.Content>
					</Collapsible.Content>
				</Collapsible.Root>
			</Card.Root>
		{/if}

		{#each draft.days as day, i (i)}
			{@const over = day.over ?? []}
			<Card.Root class={over.length > 0 ? 'border-destructive/60' : ''}>
				<Card.Header class="flex flex-row flex-wrap items-center justify-between gap-3">
					<div>
						<Card.Title>{dayLabel(i18n, day.label, i)}</Card.Title>
						<p class="text-muted-foreground mt-1 font-mono text-xs">
							{macroLine(i18n, day.totals)}
							{#if day.target}
								<span>{tf(i18n, 'planimport.meal.target_left', macroLine(i18n, day.target), macroLine(i18n, day.remaining))}</span>
							{/if}
						</p>
						{#each over as o, k (k)}
							<p class="text-destructive mt-1 text-xs font-medium">{o}</p>
						{/each}
					</div>
					<div class="flex items-center gap-2">
						{#if draft.everyDay}
							<Badge variant="secondary">{i18n.t('planimport.meal.every_day.badge')}</Badge>
						{:else if advanced}
							{@render picker(
								`d${i}.weekday`,
								weekdayItems,
								day.weekday == null ? '' : String(day.weekday),
								i18n.t('planimport.weekday_ph'),
								day.weekday == null,
								'w-40'
							)}
						{:else if day.weekday != null}
							<span class="text-muted-foreground text-sm">{weekdayName(day.weekday)}</span>
						{/if}
						<Button type="submit" variant="ghost" size="sm" name="action" value="delete-day:{i}" formnovalidate>
							{i18n.t('planimport.remove_day')}
						</Button>
					</div>
				</Card.Header>
				<Card.Content class="space-y-5">
					{#each day.meals as m, j (j)}
						<div class="space-y-2">
							<div class="flex flex-wrap items-center gap-2">
								<Input
									name="d{i}.m{j}.name"
									value={m.name}
									placeholder={tf(i18n, 'planimport.meal.meal_n', j + 1)}
									class="max-w-xs"
								/>
								<Button type="submit" variant="ghost" size="sm" name="action" value="delete-meal:{i}:{j}" formnovalidate>
									{i18n.t('planimport.meal.remove_meal')}
								</Button>
								<Button
									type="submit"
									variant="ghost"
									size="sm"
									name="action"
									value="toggle-meal-optional:{i}:{j}"
									formnovalidate
								>
									{m.optional ? i18n.t('nutrition.meal.count') : i18n.t('nutrition.meal.make.optional')}
								</Button>
								{#if m.optional}
									<Badge variant="secondary">{i18n.t('planimport.meal.slot_optional')}</Badge>
								{/if}
							</div>
							{#each options(m) as opt, o (o)}
								{@const several = (m.alternatives ?? []).length > 0}
								<div class={['space-y-1', several && 'border-border border-l-2 pl-3']}>
									{#if several}
										<div class="flex flex-wrap items-center gap-2">
											<span class="text-sm font-medium">{optionName(i18n, m, o)}</span>
											{#if o === 0}
												<Badge variant="secondary">{i18n.t('planimport.meal.counted')}</Badge>
											{/if}
											<Button
												type="submit"
												variant="ghost"
												size="sm"
												name="action"
												value="delete-option:{i}:{j}:{o}"
												formnovalidate
												aria-label={tf(i18n, 'planimport.remove_named', optionName(i18n, m, o))}
											>
												{i18n.t('planimport.meal.remove_option')}
											</Button>
										</div>
									{/if}
									<div class="overflow-x-auto">
										<Table.Root>
											<Table.Header>
												<Table.Row>
													<Table.Head>{i18n.t('planimport.meal.col.file')}</Table.Head>
													<Table.Head>{i18n.t('planimport.meal.col.ingredient')}</Table.Head>
													<Table.Head>{i18n.t('planimport.meal.col.grams')}</Table.Head>
													<Table.Head>{i18n.t('planimport.meal.col.macros')}</Table.Head>
													<Table.Head><span class="sr-only">{i18n.t('planimport.remove')}</span></Table.Head>
												</Table.Row>
											</Table.Header>
											<Table.Body>
												{#each opt.foods as f, k (k)}
													{@const ingredientItems = [
														...(f.candidates ?? []).map((c) => ({ value: c.id, label: c.name })),
														...(f.ingredientId && f.matchedName && !candidateListed(f)
															? [{ value: f.ingredientId, label: f.matchedName }]
															: []),
														...(hasStatedMacros(f) ? [{ value: 'mine', label: i18n.t('planimport.meal.save_mine') }] : [])
													]}
													<Table.Row>
														<Table.Cell class="min-w-40 align-top">
															<div class="font-medium">{f.food}</div>
															<div class="text-muted-foreground text-xs">
																{amount(f)}{#if stated(i18n, f)}{' ' + tf(i18n, 'planimport.meal.file_says', stated(i18n, f))}{/if}
															</div>
															{#if f.sourceText}
																<div class="text-muted-foreground text-xs italic">“{f.sourceText}”</div>
															{/if}
															<div class="mt-1 flex flex-wrap gap-1">
																{#if f.estimated}
																	<Badge variant="secondary">{i18n.t('planimport.meal.estimated')}</Badge>
																{/if}
																{#if f.optional}
																	<Badge variant="secondary">{i18n.t('planimport.meal.optional')}</Badge>
																{/if}
																{#each f.flags ?? [] as flag, n (n)}
																	<Badge variant="outline" class="text-left whitespace-normal">{flag}</Badge>
																{/each}
																{#each f.checks ?? [] as check, n (n)}
																	<Badge variant="destructive" class="text-left whitespace-normal">{check}</Badge>
																{/each}
															</div>
														</Table.Cell>
														<Table.Cell class="min-w-48 align-top">
															{@render picker(
																foodField(i, j, o, k, 'ingredient'),
																ingredientItems,
																ingredientValue(f),
																i18n.t('planimport.meal.choose_ingredient'),
																ingredientValue(f) === '',
																'',
																true
															)}
														</Table.Cell>
														<Table.Cell class="align-top">
															<Input
																name={foodField(i, j, o, k, 'grams')}
																type="number"
																value={gramsText(f.grams)}
																class="w-24"
																step="any"
																min="0"
																aria-invalid={f.grams == null ? 'true' : undefined}
															/>
														</Table.Cell>
														<Table.Cell class="align-top font-mono text-xs">{macroLine(i18n, f.macros)}</Table.Cell>
														<Table.Cell class="align-top">
															<Button
																type="submit"
																variant="ghost"
																size="sm"
																name="action"
																value="delete-food:{i}:{j}:{o}:{k}"
																formnovalidate
																aria-label={tf(i18n, 'planimport.remove_named', f.food)}
															>
																{i18n.t('planimport.remove')}
															</Button>
														</Table.Cell>
													</Table.Row>
												{/each}
											</Table.Body>
										</Table.Root>
									</div>
								</div>
							{/each}
						</div>
					{/each}
				</Card.Content>
			</Card.Root>
		{/each}

		{#if view.needsConfirm && draft.canConfirm && anyOver(draft.days)}
			<Alert.Root variant="destructive">
				<Alert.Title>{i18n.t('planimport.meal.over.title')}</Alert.Title>
				<Alert.Description>
					<p>{i18n.t('planimport.meal.over.body')}</p>
					<div class="mt-3">
						<Button type="submit" variant="destructive" name="action" value="save-confirm" disabled={busy}>
							{i18n.t('planimport.meal.over.confirm')}
						</Button>
					</div>
				</Alert.Description>
			</Alert.Root>
		{/if}

		<div class="flex flex-wrap items-center justify-end gap-2">
			<Button href="/app/nutrition/plans" variant="ghost">{i18n.t('planimport.cancel_import')}</Button>
			<Button type="submit" variant="outline" name="action" value="update" formnovalidate disabled={busy}>
				{i18n.t('planimport.meal.recalculate')}
			</Button>
			<Button type="submit" name="action" value="save" disabled={busy}>{i18n.t('planimport.save_plan')}</Button>
		</div>
	</form>
</div>
