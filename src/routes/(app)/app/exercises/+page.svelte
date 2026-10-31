<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import ExerciseArtCredit from '#lib/components/khepri/ExerciseArtCredit.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as Pagination from '#lib/components/ui/pagination/index.js';
	import ExerciseRow from '#lib/features/exercises/ExerciseRow.svelte';
	import FilterSelect from '#lib/features/exercises/FilterSelect.svelte';
	import {
		categories,
		categoryLabel,
		equipmentLabel,
		equipmentOptions,
		muscleGroups,
		muscleLabel,
		pageURL,
		summary
	} from '#lib/features/exercises/vocabulary.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();

	const f = $derived(data.filters);
	const p = $derived(data.page);
	const pager = $derived(Pagination.createPagination(p.number, p.last, 5));
	const anyIllustrated = $derived(data.found.some((e) => Boolean(e.illustrationSlug)));
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.exercises'))}</title></svelte:head>

<div class="mx-auto w-full max-w-4xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('nav.fitness')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('nav.exercises')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">
			{i18n.t('exercises.browse.lede')}
		</p>
	</header>
	<!-- A GET form, so every filtered view is a URL that can be bookmarked or shared. -->
	<form
		method="get"
		action="/app/exercises"
		class="border-hairline bg-surface grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4"
		data-sveltekit-keepfocus
	>
		<Input
			type="search"
			name="q"
			value={f.q}
			placeholder={i18n.t('exercises.filter.search')}
			aria-label={i18n.t('exercises.filter.search')}
		/>
		<FilterSelect
			id="muscle"
			name="muscle"
			value={f.muscle}
			placeholder={i18n.t('exercises.filter.muscle')}
			options={muscleGroups.map((k) => ({ value: k, label: muscleLabel(i18n, k) }))}
		/>
		<FilterSelect
			id="category"
			name="category"
			value={f.category}
			placeholder={i18n.t('exercises.filter.category')}
			options={categories.map((k) => ({ value: k, label: categoryLabel(i18n, k) }))}
		/>
		<FilterSelect
			id="equipment"
			name="equipment"
			value={f.equipment}
			placeholder={i18n.t('exercises.filter.equipment')}
			options={equipmentOptions.map((k) => ({ value: k, label: equipmentLabel(i18n, k) }))}
		/>
		<div class="flex gap-2 sm:col-span-2 lg:col-span-4">
			<Button type="submit">{i18n.t('exercises.filter.submit')}</Button>
			<Button href="/app/exercises" variant="ghost">{i18n.t('exercises.filter.clear')}</Button>
		</div>
	</form>
	<p class="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.14em]">
		{summary(i18n, data.found.length, p.total, p.firstRow)}
	</p>
	{#if data.found.length === 0}
		<div class="border-hairline text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
			<p>{i18n.t('exercises.browse.none')}</p>
			<a href="/app/exercises" class="text-signal mt-2 inline-block text-xs hover:underline"
				>{i18n.t('exercises.browse.clearfilters')}</a
			>
		</div>
	{:else}
		<ul class="space-y-2">
			{#each data.found as e (e.slug)}
				<ExerciseRow exercise={e} />
			{/each}
		</ul>
		{#if p.last > 1}
			<Pagination.Root class="pt-2">
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.Previous
							href={pageURL(f, p.number - 1)}
							disabled={!pager.hasPrevious}
							label={i18n.t('exercises.page.prev')}
						/>
					</Pagination.Item>
					<!-- A pager that does not reach page 1 gets an explicit link to it. -->
					{#if pager.pages.length > 0 && pager.pages[0] > 1}
						<Pagination.Item><Pagination.Link href={pageURL(f, 1)}>1</Pagination.Link></Pagination.Item>
						{#if pager.pages[0] > 2}
							<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
						{/if}
					{/if}
					{#each pager.pages as n (n)}
						<Pagination.Item>
							<Pagination.Link href={pageURL(f, n)} isActive={n === p.number}>{n}</Pagination.Link>
						</Pagination.Item>
					{/each}
					{#if pager.pages.length > 0 && pager.pages[pager.pages.length - 1] < p.last}
						{#if pager.pages[pager.pages.length - 1] < p.last - 1}
							<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
						{/if}
						<Pagination.Item><Pagination.Link href={pageURL(f, p.last)}>{p.last}</Pagination.Link></Pagination.Item>
					{/if}
					<Pagination.Item>
						<Pagination.Next href={pageURL(f, p.number + 1)} disabled={!pager.hasNext} label={i18n.t('exercises.page.next')} />
					</Pagination.Item>
				</Pagination.Content>
			</Pagination.Root>
		{/if}
		{#if anyIllustrated}
			<ExerciseArtCredit />
		{/if}
	{/if}
</div>
