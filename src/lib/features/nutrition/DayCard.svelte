<!-- Go: nutrition.dayCard, dayStatus, dayOverrideDialog and removeDay. -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { clearOnSuccess } from './enhance.js';
	import { FieldMessage, describedBy } from '#lib/components/ui/field-message/index.js';
	import MealBlock from './MealBlock.svelte';
	import { advanced, errorFor, type PlanPage } from './plan-page.js';
	import { radioClass } from './radio.js';
	import {
		dayTypeLabel,
		gramsValue,
		macroRows,
		overrideLabel,
		removeDayLine,
		rowIsOver,
		rowPercent,
		rowSummary,
		tf,
		weekdayInSentence,
		weekdayName,
		type PlanDay,
		whole
	} from './view.js';

	let { page, day }: { page: PlanPage; day: PlanDay } = $props();
	const i18n = useI18n();

	const scope = $derived(`day:${day.id}`);
	const override = $derived(overrideLabel(i18n, day));
	const status = $derived(day.status);
	const presets = $derived(page.planTypes.filter((t) => t.id !== 'custom'));
	// The override dialog opens itself when its own form was refused.
	let overrideOpen = $derived(page.problem?.scope === scope);
	let removeOpen = $state(false);
	const mealScope = $derived(`meal:${day.id}`);

	const grams = $derived(
		page.target
			? [
					{ id: 'carb-g', name: 'carb_g', text: i18n.t('nutrition.day.carbgrams'), value: day.carbG, limit: page.target.carbG },
					{ id: 'protein-g', name: 'protein_g', text: i18n.t('nutrition.field.protein'), value: day.proteinG, limit: page.target.proteinG },
					{ id: 'fat-g', name: 'fat_g', text: i18n.t('nutrition.field.fat'), value: day.fatG, limit: page.target.fatG }
				]
			: []
	);
	const closeOn = (close: () => void) => () => async ({ update }: { update: () => Promise<void> }) => {
		close();
		await update();
	};
</script>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<div class="flex items-start justify-between gap-4">
			<div class="space-y-1">
				<Card.Title>{weekdayName(i18n, day.weekday)}</Card.Title>
				{#if override}
					<Badge variant="outline">{override}</Badge>
				{/if}
			</div>
			<div class="flex items-center gap-1">
				{#if advanced(page) && page.target}
					<Dialog.Root bind:open={overrideOpen}>
						<Dialog.Trigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>{i18n.t('nutrition.day.change')}</Dialog.Trigger>
						<Dialog.Content>
							<form method="post" action="?/updateDay" class="space-y-4" use:enhance={closeOn(() => (overrideOpen = false))}>
								<input type="hidden" name="day_id" value={day.id} />
								<Dialog.Header>
									<Dialog.Title>{weekdayName(i18n, day.weekday)}</Dialog.Title>
									<Dialog.Description>{i18n.t('nutrition.day.change.desc')}</Dialog.Description>
								</Dialog.Header>
								<div class="space-y-2">
									<MonoLabel text={i18n.t('nutrition.macro.carbs')} />
									<div class="flex items-center gap-2">
										<input type="radio" id="day-{day.id}-carb-plan" name="carb_type" value="" checked={day.carbType == null} class={radioClass} />
										<Label for="day-{day.id}-carb-plan">{i18n.t('nutrition.day.followplan')}</Label>
									</div>
									{#each presets as b (b.id)}
										<div class="flex items-center gap-2">
											<input
												type="radio"
												id="day-{day.id}-carb-{b.id}"
												name="carb_type"
												value={b.id}
												checked={day.carbType === b.id}
												class={radioClass}
											/>
											<Label for="day-{day.id}-carb-{b.id}">{dayTypeLabel(i18n, b.id)}</Label>
										</div>
									{/each}
									<FieldMessage id="day-{day.id}-carb" error={errorFor(page, scope, 'carb_type')} />
								</div>
								{#each grams as g (g.name)}
									<div class="space-y-2">
										<Label for="day-{day.id}-{g.id}">{g.text}</Label>
										<Input
											id="day-{day.id}-{g.id}"
											name={g.name}
											type="number"
											value={gramsValue(g.value)}
											placeholder={tf(i18n, 'nutrition.day.upto', g.limit)}
											min="0"
											max={whole(g.limit)}
											step="any"
											aria-invalid={errorFor(page, scope, g.name) ? 'true' : undefined}
											aria-describedby={describedBy(`day-${day.id}-${g.id}`, errorFor(page, scope, g.name))}
										/>
										<FieldMessage id="day-{day.id}-{g.id}" error={errorFor(page, scope, g.name)} />
									</div>
								{/each}
								<Dialog.Footer>
									<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>{i18n.t('nutrition.cancel')}</Dialog.Close>
									<Button type="submit">{i18n.t('nutrition.day.save')}</Button>
								</Dialog.Footer>
							</form>
						</Dialog.Content>
					</Dialog.Root>
				{/if}
				{#if page.plan.days.length > 1}
					{#if day.meals.length === 0}
						<form method="post" action="?/removeDay" use:enhance>
							<input type="hidden" name="day_id" value={day.id} />
							<Button type="submit" variant="ghost" size="sm">{i18n.t('nutrition.day.remove')}</Button>
						</form>
					{:else}
						<!-- Asks first when the day would take meals with it. -->
						<Dialog.Root bind:open={removeOpen}>
							<Dialog.Trigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>{i18n.t('nutrition.day.remove')}</Dialog.Trigger>
							<Dialog.Content>
								<form method="post" action="?/removeDay" use:enhance={closeOn(() => (removeOpen = false))}>
									<input type="hidden" name="day_id" value={day.id} />
									<Dialog.Header>
										<Dialog.Title>{tf(i18n, 'nutrition.day.remove.title', weekdayInSentence(i18n, day.weekday))}</Dialog.Title>
										<Dialog.Description>{removeDayLine(i18n, day.meals.length)}</Dialog.Description>
									</Dialog.Header>
									<Dialog.Footer class="mt-4">
										<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>{i18n.t('nutrition.day.keep')}</Dialog.Close>
										<Button type="submit" variant="destructive">{i18n.t('nutrition.day.remove')}</Button>
									</Dialog.Footer>
								</form>
							</Dialog.Content>
						</Dialog.Root>
					{/if}
				{/if}
			</div>
		</div>
	</Card.Header>
	<Card.Content class="space-y-5">
		{#if status}
			<div class="space-y-2">
				{#each macroRows(i18n, status) as m (m.key)}
					<div>
						<div class="flex justify-between text-sm">
							<span>{m.name}</span>
							<span class={rowIsOver(m) ? 'text-destructive font-medium' : 'text-muted-foreground'}>{rowSummary(i18n, m)}</span>
						</div>
						<Progress value={rowPercent(m)} max={100} size="sm" variant={rowIsOver(m) ? 'danger' : 'default'} />
					</div>
				{/each}
			</div>
		{/if}
		{#each day.meals as m (m.id)}
			<MealBlock {page} meal={m} {status} />
		{/each}
		<form method="post" action="?/addMeal" class="flex gap-2" use:enhance={clearOnSuccess()}>
			<input type="hidden" name="day_id" value={day.id} />
			<Input
				id="day-{day.id}-meal-name"
				name="name"
				placeholder={i18n.t('nutrition.meal.add.placeholder')}
				aria-label={i18n.t('nutrition.meal.add.placeholder')}
				required
				disabled={!page.target}
				aria-invalid={errorFor(page, mealScope, 'name') ? 'true' : undefined}
				aria-describedby={describedBy(`day-${day.id}-meal-name`, errorFor(page, mealScope, 'name'))}
			/>
			<Button type="submit" variant="outline" disabled={!page.target}>{i18n.t('nutrition.meal.add')}</Button>
		</form>
		<FieldMessage id="day-{day.id}-meal-name" error={errorFor(page, mealScope, 'name')} />
	</Card.Content>
</Card.Root>
