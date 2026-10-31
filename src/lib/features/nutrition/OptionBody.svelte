<!--
	Go: nutrition.optionBody, portionRow and addPortionForm. One option's
	portions and the forms that add to it. counted is false for an
	alternative, whose portions leave the day's totals alone.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { clearOnSuccess } from './enhance.js';
	import { FieldMessage, describe, describedBy } from '#lib/components/ui/field-message/index.js';
	import MealVoice from './MealVoice.svelte';
	import { errorFor, type PlanPage } from './plan-page.js';
	import { kcal, previewLine, remainingLine, type DayStatus, type MealOption, whole } from './view.js';

	let { page, option, status, counted }: { page: PlanPage; option: MealOption; status?: DayStatus; counted: boolean } = $props();
	const i18n = useI18n();

	const scope = $derived(`portion:${option.id}`);
	const items = $derived(page.ingredients.map((i) => ({ value: i.id, label: i.name })));
	// Go's Alpine preview state: the food picked and the grams typed.
	let ingredientId = $state('');
	let grams = $state<number | null>(null);
	const per100 = $derived(page.ingredients.find((i) => i.id === ingredientId)?.per100g);
</script>

{#if option.ingredients.length > 0}
	<ul class="space-y-1">
		{#each option.ingredients as mi (mi.id)}
			<!-- An imported line keeps the file's own words under it. -->
			<li class="flex items-center justify-between gap-2 text-sm">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<span>{mi.name} · {whole(mi.quantityGrams)}g</span>
						{#if mi.estimated}
							<Badge variant="outline">{i18n.t('nutrition.portion.estimated')}</Badge>
						{/if}
						{#if mi.optional}
							<Badge variant="secondary">{i18n.t('nutrition.portion.optional')}</Badge>
						{/if}
					</div>
					{#if mi.sourceText}
						<p class="text-muted-foreground text-xs">{mi.sourceText}</p>
					{/if}
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<span class="text-muted-foreground">{kcal(mi.macros.calories)}</span>
					<form method="post" action="?/setPortionOptional" use:enhance>
						<input type="hidden" name="portion_id" value={mi.id} />
						<input type="hidden" name="optional" value={String(!mi.optional)} />
						<Button type="submit" variant="ghost" size="sm">
							{mi.optional ? i18n.t('nutrition.portion.count') : i18n.t('nutrition.portion.makeoptional')}
						</Button>
					</form>
					<form method="post" action="?/removePortion" use:enhance>
						<input type="hidden" name="portion_id" value={mi.id} />
						<Button type="submit" variant="ghost" size="sm">{i18n.t('nutrition.remove')}</Button>
					</form>
				</div>
			</li>
		{/each}
	</ul>
{/if}
{#if status}
	<form
		method="post"
		action="?/addPortion"
		class="space-y-2"
		use:enhance={clearOnSuccess(() => {
			ingredientId = '';
			grams = null;
		})}
	>
		<input type="hidden" name="meal_id" value={option.id} />
		<div class="flex items-end gap-2">
			<div class="min-w-0 flex-1" {@attach describe(`option-${option.id}-ingredient`, describedBy(`option-${option.id}-ingredient`, errorFor(page, scope, 'ingredient_id')))}>
				<SearchSelect
					id="option-{option.id}-ingredient"
					name="ingredient_id"
					bind:value={ingredientId}
					{items}
					placeholder={i18n.t('nutrition.ingredient.choose')}
					aria-label={i18n.t('nutrition.ingredient.choose')}
					invalid={Boolean(errorFor(page, scope, 'ingredient_id'))}
				/>
			</div>
			<div class="w-24">
				<Input
					id="option-{option.id}-grams"
					name="quantity_grams"
					type="number"
					placeholder={i18n.t('nutrition.grams')}
					aria-label={i18n.t('nutrition.grams')}
					min="1"
					bind:value={grams}
					aria-invalid={errorFor(page, scope, 'quantity_grams') ? 'true' : undefined}
					aria-describedby={describedBy(`option-${option.id}-grams`, errorFor(page, scope, 'quantity_grams'))}
				/>
			</div>
			<Button type="submit" variant="outline">{i18n.t('nutrition.add')}</Button>
		</div>
		{#if counted}
			<!-- What the day has left, and what it would after this portion. -->
			<p class="text-muted-foreground text-xs">
				{#if ingredientId && grams}
					{previewLine(i18n, status, per100, grams)}
				{:else}
					{remainingLine(i18n, status)}
				{/if}
			</p>
		{/if}
		<FieldMessage id="option-{option.id}-ingredient" error={errorFor(page, scope, 'ingredient_id')} />
		<FieldMessage id="option-{option.id}-grams" error={errorFor(page, scope, 'quantity_grams')} />
	</form>
	<MealVoice mealId={option.id} />
{/if}
