<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import ChoiceSelect from '#lib/features/calculator/ChoiceSelect.svelte';
	import {
		ACTIVITY_MODERATE,
		display,
		GOAL_MAINTENANCE,
		heightUnit,
		SPLIT_MODERATE_CARB,
		weightUnit,
		whole
	} from '#lib/features/calculator/units.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/calculator/calculator.templ.
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const calc = $derived(data.calculator);
	const bio = $derived(calc.biometrics);
	const plan = $derived(calc.goal);
	const units = $derived(data.units);

	const bioValues = $derived(form?.biometrics?.values ?? { weight: '', height: '', date_of_birth: '', sex: '' });
	const bioErrors = $derived<Record<string, string>>(form?.biometrics?.errors ?? {});
	const planValues = $derived(form?.plan?.values ?? { activity_level: '', goal: '', macro_split: '' });
	const planErrors = $derived<Record<string, string>>(form?.plan?.errors ?? {});

	/** An option's name alone ("Moderate"). */
	const optionLabel = (kind: string, value: string) => i18n.t(`calculator.${kind}.${value}`);
	/** "Label — what it means": the choice means nothing without it. */
	const choiceLabel = (kind: string, value: string) =>
		`${optionLabel(kind, value)} — ${i18n.t(`calculator.${kind}.${value}.desc`)}`;
	const choices = (kind: string, values: string[]) => values.map((v) => ({ value: v, label: choiceLabel(kind, v) }));

	const currentMeasurements = $derived.by(() => {
		if (!bio) return '';
		const shown = display(bio.weightKg, bio.heightCm, units);
		return i18n.tf(
			'calculator.bio.current',
			i18n.decimal(shown.weight, 1),
			weightUnit(units),
			i18n.decimal(shown.height, 1),
			heightUnit(units),
			bio.ageYears
		);
	});

	const planSummary = $derived.by(() => {
		if (!plan) return '';
		return i18n.tf(
			'calculator.plan.summary',
			optionLabel('goal', plan.goal),
			whole(plan.calorieGoal),
			whole(plan.bmr),
			whole(plan.tdee),
			i18n.t(`calculator.split.${plan.macroSplit}.short`),
			whole(plan.proteinG),
			whole(plan.fatG),
			whole(plan.carbG)
		);
	});

	const errorClass = 'text-[0.8rem] font-medium text-red-500';
</script>

<svelte:head><title>{pageTitle(i18n.t('calculator.page'))}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('nav.fitness')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('calculator.heading')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('calculator.intro')}</p>
	</header>

	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('calculator.bio.title')}</Card.Title>
			<Card.Description>{bio ? currentMeasurements : i18n.t('calculator.bio.empty')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" action="?/biometrics" class="space-y-4" use:enhance>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="weight">{i18n.tf('calculator.bio.weight', weightUnit(units))}</Label>
						<Input
							id="weight"
							name="weight"
							type="number"
							step="0.1"
							value={bioValues.weight}
							required
							aria-invalid={bioErrors.weight_kg ? 'true' : undefined}
						/>
						{#if bioErrors.weight_kg}<p class={errorClass}>{bioErrors.weight_kg}</p>{/if}
					</div>
					<div class="space-y-2">
						<Label for="height">{i18n.tf('calculator.bio.height', heightUnit(units))}</Label>
						<Input
							id="height"
							name="height"
							type="number"
							step="0.1"
							value={bioValues.height}
							required
							aria-invalid={bioErrors.height_cm ? 'true' : undefined}
						/>
						{#if bioErrors.height_cm}<p class={errorClass}>{bioErrors.height_cm}</p>{/if}
					</div>
				</div>
				<div class="space-y-2">
					<Label for="date_of_birth">{i18n.t('calculator.bio.dob')}</Label>
					<Input
						id="date_of_birth"
						name="date_of_birth"
						type="date"
						value={bioValues.date_of_birth}
						required
						aria-invalid={bioErrors.date_of_birth ? 'true' : undefined}
					/>
					{#if bioErrors.date_of_birth}<p class={errorClass}>{bioErrors.date_of_birth}</p>{/if}
				</div>
				<div class="space-y-2">
					<Label>{i18n.t('calculator.bio.sex')}</Label>
					<ChoiceSelect
						id="sex"
						name="sex"
						placeholder={i18n.t('calculator.bio.choose')}
						selected={bioValues.sex}
						items={[
							{ value: 'male', label: i18n.t('calculator.bio.male') },
							{ value: 'female', label: i18n.t('calculator.bio.female') }
						]}
					/>
					{#if bioErrors.sex}<p class={errorClass}>{bioErrors.sex}</p>{/if}
				</div>
				<Button type="submit" variant="outline">{i18n.t('calculator.bio.save')}</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('calculator.plan.title')}</Card.Title>
			<Card.Description>{plan ? planSummary : i18n.t('calculator.plan.empty')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" action="?/generate" class="space-y-4" use:enhance>
				<div class="space-y-2">
					<Label>{i18n.t('calculator.plan.activity')}</Label>
					<ChoiceSelect
						id="activity_level"
						name="activity_level"
						placeholder={optionLabel('activity', ACTIVITY_MODERATE)}
						selected={planValues.activity_level}
						items={choices('activity', calc.options.activityLevels)}
					/>
				</div>
				<div class="space-y-2">
					<Label>{i18n.t('calculator.plan.goal')}</Label>
					<ChoiceSelect
						id="goal"
						name="goal"
						placeholder={optionLabel('goal', GOAL_MAINTENANCE)}
						selected={planValues.goal}
						items={choices('goal', calc.options.goals)}
					/>
				</div>
				<div class="space-y-2">
					<Label>{i18n.t('calculator.plan.split')}</Label>
					<ChoiceSelect
						id="macro_split"
						name="macro_split"
						placeholder={optionLabel('split', SPLIT_MODERATE_CARB)}
						selected={planValues.macro_split}
						items={choices('split', calc.options.macroSplits)}
					/>
				</div>
				{#if planErrors._}<p class={errorClass}>{planErrors._}</p>{/if}
				<Button type="submit" class="bg-signal text-background hover:bg-signal/90">{i18n.t('calculator.plan.submit')}</Button>
			</form>
		</Card.Content>
	</Card.Root>

	{#if plan}
		<!-- What each objective would cost at this TDEE (Go: goalComparison). -->
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{i18n.t('calculator.compare.title')}</Card.Title>
				<Card.Description>{i18n.tf('calculator.compare.desc', whole(plan.tdee))}</Card.Description>
			</Card.Header>
			<Card.Content>
				<dl class="space-y-2">
					{#each plan.comparison as c (c.goal)}
						<div class="flex items-baseline justify-between gap-4">
							<dt class="text-sm">
								{optionLabel('goal', c.goal)}
								{#if c.goal === plan.goal}
									<span class="text-signal ml-2 font-mono text-[10px] tracking-[0.14em] uppercase">
										{i18n.t('calculator.compare.yours')}
									</span>
								{/if}
							</dt>
							<dd class="text-sm font-medium tabular-nums">{whole(c.calorieGoal)} kcal</dd>
						</div>
					{/each}
				</dl>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
