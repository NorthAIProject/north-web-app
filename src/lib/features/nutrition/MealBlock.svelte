<!--
	Go: nutrition.mealBlock, mealOptionTabs, mealHeading, mealOptionalButton,
	removeMealButton and addOptionForm. A slot with options shows each in a tab
	of its own; only the first counts toward the day, and none does when the
	slot is optional.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { clearOnSuccess } from './enhance.js';
	import { FieldMessage, describedBy } from '#lib/components/ui/field-message/index.js';
	import OptionBody from './OptionBody.svelte';
	import { errorFor, type PlanPage } from './plan-page.js';
	import { kcal, openOption, optionTabLabel, slotOptions, tf, type DayStatus, type PlanMeal } from './view.js';

	let { page, meal, status }: { page: PlanPage; meal: PlanMeal; status?: DayStatus } = $props();
	const i18n = useI18n();

	const options = $derived(slotOptions(meal));
	let open = $derived(openOption(meal, page.problem?.scope ?? '', page.openOption));
	const optionScope = $derived(`option:${meal.id}`);
</script>

{#snippet heading()}
	<div class="flex flex-wrap items-center gap-2">
		<h3 class="font-medium">{meal.name}</h3>
		{#if meal.optional}
			<Badge variant="secondary">{i18n.t('nutrition.meal.optional.badge')}</Badge>
		{/if}
	</div>
{/snippet}

{#snippet optionalButton()}
	<!-- Counting it again is checked against the target like adding its food. -->
	<form method="post" action="?/setMealOptional" use:enhance>
		<input type="hidden" name="meal_id" value={meal.id} />
		<input type="hidden" name="optional" value={String(!meal.optional)} />
		<Button type="submit" variant="ghost" size="sm">
			{meal.optional ? i18n.t('nutrition.meal.count') : i18n.t('nutrition.meal.make.optional')}
		</Button>
	</form>
{/snippet}

{#snippet removeButton(id: string, text: string)}
	<!-- The service removes the whole slot for a default, only the option for an alternative. -->
	<form method="post" action="?/removeMeal" use:enhance>
		<input type="hidden" name="meal_id" value={id} />
		<Button type="submit" variant="ghost" size="sm">{text}</Button>
	</form>
{/snippet}

<section class="border-hairline space-y-3 border-t pt-4">
	{#if options.length === 1}
		<div class="flex flex-wrap items-center justify-between gap-2">
			{@render heading()}
			<div class="flex items-center gap-2">
				<span class="text-muted-foreground text-sm">{kcal(meal.totalMacros.calories)}</span>
				{@render optionalButton()}
				{@render removeButton(meal.id, i18n.t('nutrition.meal.remove'))}
			</div>
		</div>
		<OptionBody {page} option={meal} {status} counted={!meal.optional} />
	{:else}
		<div class="flex flex-wrap items-center justify-between gap-2">
			{@render heading()}
			<div class="flex items-center gap-2">
				{@render optionalButton()}
				{@render removeButton(meal.id, i18n.t('nutrition.meal.remove.all'))}
			</div>
		</div>
		<Tabs.Root bind:value={open}>
			<Tabs.List class="h-auto max-w-full flex-wrap justify-start">
				{#each options as o, i (o.id)}
					<Tabs.Trigger value={o.id} class="flex-none">
						{optionTabLabel(i18n, o, i)}
						{#if i === 0 && !meal.optional}
							<Badge variant="secondary">{i18n.t('nutrition.option.counted')}</Badge>
						{/if}
					</Tabs.Trigger>
				{/each}
			</Tabs.List>
			{#each options as o, i (o.id)}
				<Tabs.Content value={o.id} class="space-y-3 pt-3">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground text-sm">
							{#if meal.optional}
								{tf(i18n, 'nutrition.option.optional', o.totalMacros.calories)}
							{:else if i === 0}
								{tf(i18n, 'nutrition.option.counts', o.totalMacros.calories)}
							{:else}
								{tf(i18n, 'nutrition.option.instead', o.totalMacros.calories)}
							{/if}
						</span>
						{#if i > 0}
							{@render removeButton(o.id, i18n.t('nutrition.option.remove'))}
						{/if}
					</div>
					<OptionBody {page} option={o} {status} counted={i === 0 && !meal.optional} />
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	{/if}
	<!-- A blank label is numbered by its position. -->
	<form method="post" action="?/addOption" class="flex items-center gap-2" use:enhance={clearOnSuccess()}>
		<input type="hidden" name="meal_id" value={meal.id} />
		<Input
			id="meal-{meal.id}-option-label"
			name="option_label"
			placeholder={i18n.t('nutrition.option.label.placeholder')}
			aria-label={i18n.t('nutrition.option.label.placeholder')}
			class="h-8 text-sm"
			disabled={!page.target}
			aria-invalid={errorFor(page, optionScope, 'option_label') ? 'true' : undefined}
			aria-describedby={describedBy(`meal-${meal.id}-option-label`, errorFor(page, optionScope, 'option_label'))}
		/>
		<Button type="submit" variant="ghost" size="sm" disabled={!page.target}>{i18n.t('nutrition.option.add')}</Button>
	</form>
	<FieldMessage id="meal-{meal.id}-option-label" error={errorFor(page, optionScope, 'option_label')} />
</section>
