<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { FieldMessage, describe, describedBy, withInvalidFocus } from '#lib/components/ui/field-message/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import MealReview from '#lib/features/planimport/MealReview.svelte';
	import { bandChoice, CARB_BANDS, say } from '#lib/features/planimport/view.js';
	import DictateField from '#lib/features/voice/DictateField.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/planimport/generate.templ (MealGeneratePage); a drafted plan shows
	// the import's review page (meal.templ) in its place.
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const f = $derived(form?.generate ?? data.generate);
	const errors = $derived<Record<string, string>>(f.errors ?? {});
	const objectives = ['cutting', 'maintenance', 'bulking'];
	const objectiveItems = $derived(objectives.map((o) => ({ value: o, label: i18n.t(`planimport.generate.objective.${o}`) })));
	const planTypeItems = $derived(CARB_BANDS.map((b) => ({ value: b.type, label: bandChoice(i18n, b) })));
	const count = (n: number) => (n === 0 ? '' : String(n));
	let busy = $state(false);
</script>

<svelte:head>
	<title>{pageTitle(i18n.t(form?.review ? 'planimport.review.title' : 'planimport.generate.page'))}</title>
</svelte:head>

{#snippet message(name: string)}
	<FieldMessage id={name} error={errors[name]} />
{/snippet}

{#snippet picker(id: string, items: { value: string; label: string }[], selected: string)}
	<div class="contents" {@attach describe(id, describedBy(id, errors[id]))}>
		<SearchSelect
			{id}
			name={id}
			value={selected}
			{items}
			placeholder={i18n.t('planimport.meal.choose_one')}
			invalid={Boolean(errors[id])}
			search={false}
		/>
	</div>
{/snippet}

{#if form?.review}
	<MealReview view={form.review} />
{:else}
	<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
		<header>
			<MonoLabel text={i18n.t('planimport.generate.label')} />
			<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('planimport.generate.title')}</h1>
			<p class="text-muted-foreground mt-1 text-sm">{i18n.t('planimport.generate.lede')}</p>
		</header>
		{#if f.error}
			<Alert.Root variant="destructive">
				<Alert.Description>{say(i18n, f.error)}</Alert.Description>
			</Alert.Root>
		{/if}
		{#if f.noTarget}
			<Card.Root>
				<Card.Content class="space-y-4 pt-6">
					<p class="text-sm">{i18n.t('planimport.generate.notarget')}</p>
					<Button href="/app/calculator">{i18n.t('planimport.generate.calculator')}</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<Card.Root>
				<Card.Content>
					<form
						method="post"
						class="space-y-5 pt-6"
						use:enhance={withInvalidFocus(() => {
							busy = true;
							return async ({ update }) => {
								await update({ reset: false });
								busy = false;
							};
						})}
					>
						<div class="space-y-2">
							<Label for="objective" error={errors.objective}>{i18n.t('planimport.generate.objective')}</Label>
							{@render picker('objective', objectiveItems, f.objective)}
							{@render message('objective')}
						</div>
						<div class="grid gap-5 sm:grid-cols-2">
							<div class="space-y-2">
								<Label for="days" error={errors.days}>{i18n.t('planimport.generate.days')}</Label>
								<Input
									id="days"
									name="days"
									type="number"
									value={count(f.days)}
									required
									min="1"
									max="7"
									aria-invalid={errors.days ? 'true' : undefined}
									aria-describedby={describedBy('days', errors.days)}
								/>
								{@render message('days')}
							</div>
							<div class="space-y-2">
								<Label for="meals_per_day" error={errors.meals_per_day}>{i18n.t('planimport.generate.meals')}</Label>
								<Input
									id="meals_per_day"
									name="meals_per_day"
									type="number"
									value={count(f.mealsPerDay)}
									required
									min="1"
									max="8"
									aria-invalid={errors.meals_per_day ? 'true' : undefined}
									aria-describedby={describedBy('meals_per_day', errors.meals_per_day)}
								/>
								{@render message('meals_per_day')}
							</div>
						</div>
						<div class="space-y-2">
							<Label for="plan_type" error={errors.plan_type}>{i18n.t('planimport.generate.plantype')}</Label>
							{@render picker('plan_type', planTypeItems, f.planType)}
							<p class="text-muted-foreground text-sm">{i18n.t('planimport.generate.plantype.desc')}</p>
							{@render message('plan_type')}
						</div>
						<div class="space-y-2">
							<Label for="exclusions" error={errors.exclusions}>{i18n.t('planimport.generate.exclusions')}</Label>
							<DictateField target="exclusions">
								<Textarea
									id="exclusions"
									name="exclusions"
									value={f.exclusions.join(', ')}
									rows={2}
									placeholder={i18n.t('planimport.generate.exclusions.ph')}
									aria-invalid={errors.exclusions ? 'true' : undefined}
									aria-describedby={describedBy('exclusions', errors.exclusions)}
								/>
							</DictateField>
							<p class="text-muted-foreground text-sm">{i18n.t('planimport.generate.exclusions.desc')}</p>
							{@render message('exclusions')}
						</div>
						<div class="space-y-2">
							<Label for="notes" error={errors.notes}>{i18n.t('planimport.generate.notes')}</Label>
							<DictateField target="notes">
								<Textarea
									id="notes"
									name="notes"
									value={f.notes}
									rows={2}
									placeholder={i18n.t('planimport.generate.notes.ph')}
									aria-invalid={errors.notes ? 'true' : undefined}
									aria-describedby={describedBy('notes', errors.notes)}
								/>
							</DictateField>
							{@render message('notes')}
						</div>
						<Button type="submit" class="w-full" disabled={busy}>
							{busy ? i18n.t('planimport.generate.busy') : i18n.t('planimport.generate.submit')}
						</Button>
						<p class="text-muted-foreground text-center text-xs">{i18n.t('planimport.generate.wait')}</p>
					</form>
				</Card.Content>
			</Card.Root>
		{/if}
		<Button href="/app/nutrition/plans" variant="ghost">{i18n.t('planimport.cancel')}</Button>
	</div>
{/if}
