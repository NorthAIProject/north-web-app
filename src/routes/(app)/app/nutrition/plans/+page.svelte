<!-- Go: web/nutrition/plans.templ (PlansIndexPage). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { FieldMessage, describedBy, withInvalidFocus } from '#lib/components/ui/field-message/index.js';
	import PlanTypeFields from '#lib/features/nutrition/PlanTypeFields.svelte';
	import TargetNotice from '#lib/features/nutrition/TargetNotice.svelte';
	import { radioClass } from '#lib/features/nutrition/radio.js';
	import { daysLabel, planTypeLabel, WEEK_ORDER, weekdayShort } from '#lib/features/nutrition/view.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const values = $derived(form?.values);
	const errors = $derived<Record<string, string>>(form?.errors ?? {});
	const target = $derived(data.options.target);
	// Go's x-data: easy and mid carb until the person picks.
	let mode = $derived(values?.mode || 'easy');
	let type = $derived(values?.plan_type || 'mid_carb');
	const dayCount = $derived(values?.day_count || String(data.options.maxDays));
	const hasWeekday = (wd: number) => values?.weekdays.includes(wd) ?? false;
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.meal-plans'))}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('nutrition.mono')} />
		<div class="mt-2 flex items-center justify-between gap-4">
			<h1 class="text-2xl font-medium tracking-tight">{i18n.t('nav.meal-plans')}</h1>
			<div class="flex flex-wrap justify-end gap-2">
				<Button variant="outline" size="sm" href="/app/nutrition/import">{i18n.t('nutrition.plans.import')}</Button>
				<Button size="sm" href="/app/nutrition/plans/generate">{i18n.t('planimport.generate.button')}</Button>
			</div>
		</div>
	</header>
	<TargetNotice {target} />
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('nutrition.plans.new')}</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="post" action="/app/nutrition/plans" class="space-y-5" use:enhance={withInvalidFocus(() => async ({ update }) => update({ reset: false }))}>
				<fieldset class="space-y-5" disabled={!target}>
					<div class="space-y-2">
						<Label for="name">{i18n.t('nutrition.field.name')}</Label>
						<Input
							id="name"
							name="name"
							value={values?.name ?? ''}
							required
							aria-invalid={errors.name ? 'true' : undefined}
							aria-describedby={describedBy('name', errors.name)}
						/>
						<FieldMessage id="name" error={errors.name} />
					</div>
					<div class="space-y-2">
						<Label for="description">{i18n.t('nutrition.field.description')}</Label>
						<Input id="description" name="description" value={values?.description ?? ''} />
					</div>
					<fieldset class="space-y-2">
						<legend class="mb-2"><MonoLabel text={i18n.t('nutrition.field.mode')} /></legend>
						<div class="flex items-center gap-2">
							<input type="radio" id="new-mode-easy" name="mode" value="easy" bind:group={mode} class={radioClass} />
							<Label for="new-mode-easy">{i18n.t('nutrition.mode.easy.desc')}</Label>
						</div>
						<div class="flex items-center gap-2">
							<input type="radio" id="new-mode-advanced" name="mode" value="advanced" bind:group={mode} class={radioClass} />
							<Label for="new-mode-advanced">{i18n.t('nutrition.mode.advanced.desc')}</Label>
						</div>
					</fieldset>
					<PlanTypeFields
						prefix="new"
						{target}
						planTypes={data.options.planTypes}
						{mode}
						bind:type
						customPct={values?.custom_carb_pct ?? ''}
						{errors}
					/>
					<div class:hidden={mode !== 'easy'}>
						<div class="space-y-2">
							<Label for="day_count">{i18n.t('nutrition.field.daycount')}</Label>
							<Input
								id="day_count"
								name="day_count"
								type="number"
								value={dayCount}
								min="1"
								max={String(data.options.maxDays)}
								aria-invalid={errors.day_count ? 'true' : undefined}
								aria-describedby={describedBy('day_count', errors.day_count)}
							/>
							<FieldMessage id="day_count" error={errors.day_count} />
						</div>
					</div>
					<div class:hidden={mode !== 'advanced'}>
						<fieldset class="space-y-2" aria-describedby={describedBy('weekdays', errors.weekdays)}>
							<legend class="mb-2"><MonoLabel text={i18n.t('nutrition.field.weekdays')} /></legend>
							<div class="flex flex-wrap gap-4">
								{#each WEEK_ORDER as wd (wd)}
									<div class="flex items-center gap-2">
										<Checkbox id="weekday-{wd}" name="weekdays" value={String(wd)} checked={hasWeekday(wd)} />
										<Label for="weekday-{wd}">{weekdayShort(i18n, wd)}</Label>
									</div>
								{/each}
							</div>
							<FieldMessage id="weekdays" error={errors.weekdays} />
						</fieldset>
					</div>
					<FieldMessage id="macro_target" error={errors.macro_target} />
					<Button type="submit">{i18n.t('nutrition.plans.create')}</Button>
				</fieldset>
			</form>
		</Card.Content>
	</Card.Root>
	{#if data.plans.length > 0}
		<section class="space-y-3">
			<h2 class="text-sm font-medium">{i18n.t('nutrition.plans.yours')}</h2>
			{#each data.plans as p (p.id)}
				<a href="/app/nutrition/plans/{p.id}" class="block">
					<Card.Root class="border-hairline hover:border-muted-foreground/30 transition-colors">
						<Card.Content class="py-4">
							<div class="flex items-center justify-between gap-4">
								<span class="font-medium">{p.name}</span>
								<div class="flex items-center gap-2">
									<Badge variant="secondary">{planTypeLabel(i18n, p)}</Badge>
									<span class="text-muted-foreground text-sm">{daysLabel(i18n, p.dayCount)}</span>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				</a>
			{/each}
		</section>
	{/if}
</div>
