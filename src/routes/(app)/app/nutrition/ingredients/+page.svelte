<!-- Go: web/nutrition/ingredients.templ (IngredientsPage). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import FieldMessage from '#lib/features/nutrition/FieldMessage.svelte';
	import { clearOnSuccess } from '#lib/features/nutrition/enhance.js';
	import { CATEGORIES, categoryLabel, whole } from '#lib/features/nutrition/view.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	// A refused add keeps what was typed (Go: IngredientForm).
	const values = $derived(form?.values);
	const errors = $derived<Record<string, string>>(form?.errors ?? {});
	let category = $derived(values?.category ?? '');
	const categoryItems = $derived(CATEGORIES.map((c) => ({ value: c, label: categoryLabel(i18n, c) })));
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.ingredients'))}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('nutrition.mono')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('nav.ingredients')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('nutrition.ingredients.intro')}</p>
	</header>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('nutrition.ingredients.add.title')}</Card.Title>
			<Card.Description>{i18n.t('nutrition.ingredients.add.per100')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" action="?/create" class="space-y-4" use:enhance={clearOnSuccess(() => (category = ''))}>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="name">{i18n.t('nutrition.field.name')}</Label>
						<Input id="name" name="name" value={values?.name ?? ''} required aria-invalid={errors.name ? 'true' : undefined} />
						<FieldMessage message={errors.name} />
					</div>
					<div class="space-y-2">
						<Label for="brand">{i18n.t('nutrition.field.brand')}</Label>
						<Input id="brand" name="brand" value={values?.brand ?? ''} />
					</div>
				</div>
				<div class="space-y-2">
					<Label>{i18n.t('nutrition.field.category')}</Label>
					<Select.Root type="single" name="category" bind:value={category} items={categoryItems}>
						<Select.Trigger id="category">
							<Select.Value placeholder={i18n.t('nutrition.category.other')} />
						</Select.Trigger>
						<Select.Content>
							{#each categoryItems as c (c.value)}
								<Select.Item value={c.value} label={c.label}>{c.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<FieldMessage message={errors.category} />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="calories_per_100g">{i18n.t('nutrition.field.calories')}</Label>
						<Input
							id="calories_per_100g"
							name="calories_per_100g"
							type="number"
							value={values?.calories_per_100g ?? ''}
							required
							aria-invalid={errors.calories_per_100g ? 'true' : undefined}
						/>
						<FieldMessage message={errors.calories_per_100g} />
					</div>
					<div class="space-y-2">
						<Label for="serving_size_grams">{i18n.t('nutrition.field.serving')}</Label>
						<Input id="serving_size_grams" name="serving_size_grams" type="number" value={values?.serving_size_grams ?? ''} placeholder="100" />
					</div>
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div class="space-y-2">
						<Label for="protein_g_per_100g">{i18n.t('nutrition.field.protein')}</Label>
						<Input id="protein_g_per_100g" name="protein_g_per_100g" type="number" value={values?.protein_g_per_100g ?? ''} />
					</div>
					<div class="space-y-2">
						<Label for="fat_g_per_100g">{i18n.t('nutrition.field.fat')}</Label>
						<Input id="fat_g_per_100g" name="fat_g_per_100g" type="number" value={values?.fat_g_per_100g ?? ''} />
					</div>
					<div class="space-y-2">
						<Label for="carbs_g_per_100g">{i18n.t('nutrition.field.carbs')}</Label>
						<Input id="carbs_g_per_100g" name="carbs_g_per_100g" type="number" value={values?.carbs_g_per_100g ?? ''} />
					</div>
				</div>
				<Button type="submit" class="bg-signal text-background hover:bg-signal/90">{i18n.t('nutrition.ingredients.add.submit')}</Button>
			</form>
		</Card.Content>
	</Card.Root>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('nutrition.ingredients.search.title')}</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="get" action="/app/nutrition/ingredients" class="mb-4">
				<Input name="q" value={data.query} placeholder={i18n.t('nutrition.ingredients.search.placeholder')} />
			</form>
			{#if data.ingredients.length === 0}
				<p class="text-muted-foreground text-sm">{i18n.t('nutrition.ingredients.none')}</p>
			{:else}
				<ul class="space-y-2">
					{#each data.ingredients as ing (ing.id)}
						<li class="border-hairline flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
							<div>
								<span class="font-medium">{ing.name}</span>
								<span class="text-muted-foreground ml-2"
									>{categoryLabel(i18n, ing.category)} · {whole(ing.per100g.calories)} kcal/100g</span
								>
							</div>
							{#if !ing.own}
								<Badge variant="outline">{i18n.t('nutrition.ingredients.shared')}</Badge>
							{:else}
								<form method="post" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={ing.id} />
									<Button type="submit" variant="ghost" size="sm">{i18n.t('nutrition.delete')}</Button>
								</form>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
