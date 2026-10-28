<!-- Go: web/nutrition/log.templ (LogPage). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { clearOnSuccess } from '#lib/features/nutrition/enhance.js';
	import { kcal } from '#lib/features/nutrition/view.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();

	let ingredientId = $state('');
	let mealId = $state('');
	const ingredientItems = $derived(data.ingredients.map((i) => ({ value: i.id, label: i.name })));
	const mealItems = $derived(data.mealOptions.map((m) => ({ value: m.id, label: m.label })));
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.food-log'))}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
	<header class="flex items-end justify-between gap-4">
		<div>
			<MonoLabel text={i18n.t('nutrition.mono')} />
			<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('nutrition.log.title')}</h1>
		</div>
		<Button variant="outline" size="sm" href="/app/nutrition/import">{i18n.t('nutrition.log.import')}</Button>
	</header>
	{#if data.log.progress}
		<Card.Root class="border-hairline bg-surface">
			<Card.Content>
				<p class="text-sm">{data.log.progress.summary}</p>
				{#if data.log.progress.recommendation}
					<p class="text-muted-foreground mt-2 text-sm">{data.log.progress.recommendation}</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
	<!--
		Go embeds the quick-capture panel here (capture.Embed, an htmx partial of
		the capture feature). Until that feature's panel component lands, the
		card links to the capture page, which returns here when done.
	-->
	<Card.Root class="border-hairline bg-surface" data-testid="capture-embed">
		<Card.Header>
			<Card.Title>{i18n.t('capture.embed.food.title')}</Card.Title>
			<Card.Description>{i18n.t('capture.embed.food.intro')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<Button variant="outline" href="/app/capture?return_to=%2Fapp%2Fnutrition%2Flog">{i18n.t('capture.heading')}</Button>
		</Card.Content>
	</Card.Root>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('nutrition.log.ingredient.title')}</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="post" action="?/ingredient" class="flex items-end gap-2" use:enhance={clearOnSuccess(() => (ingredientId = ''))}>
				<div class="min-w-0 flex-1">
					<Select.Root type="single" name="ingredient_id" bind:value={ingredientId} items={ingredientItems}>
						<Select.Trigger aria-label={i18n.t('nutrition.ingredient.choose')}>
							<Select.Value placeholder={i18n.t('nutrition.ingredient.choose')} />
						</Select.Trigger>
						<Select.Content>
							{#each ingredientItems as item (item.value)}
								<Select.Item value={item.value} label={item.label}>{item.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="w-24">
					<Input name="quantity_grams" type="number" placeholder={i18n.t('nutrition.grams')} aria-label={i18n.t('nutrition.grams')} />
				</div>
				<Button type="submit" variant="outline">{i18n.t('nutrition.log.submit')}</Button>
			</form>
		</Card.Content>
	</Card.Root>
	{#if data.mealOptions.length > 0}
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{i18n.t('nutrition.log.meal.title')}</Card.Title>
			</Card.Header>
			<Card.Content>
				<form method="post" action="?/meal" class="flex items-end gap-2" use:enhance={clearOnSuccess(() => (mealId = ''))}>
					<div class="min-w-0 flex-1">
						<Select.Root type="single" name="meal_id" bind:value={mealId} items={mealItems}>
							<Select.Trigger aria-label={i18n.t('nutrition.log.meal.choose')}>
								<Select.Value placeholder={i18n.t('nutrition.log.meal.choose')} />
							</Select.Trigger>
							<Select.Content>
								{#each mealItems as item (item.value)}
									<Select.Item value={item.value} label={item.label}>{item.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<Button type="submit" variant="outline">{i18n.t('nutrition.log.submit')}</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
	{#if data.log.entries.length > 0}
		<section class="space-y-2">
			<h2 class="text-sm font-medium">{i18n.t('nutrition.log.today')}</h2>
			{#each data.log.entries as e (e.id)}
				<div class="border-hairline flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
					<span>{e.label}</span>
					<div class="flex items-center gap-2">
						<span class="text-muted-foreground">{kcal(e.macros.calories)}</span>
						<form method="post" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={e.id} />
							<Button type="submit" variant="ghost" size="sm">{i18n.t('nutrition.remove')}</Button>
						</form>
					</div>
				</div>
			{/each}
		</section>
	{/if}
</div>
