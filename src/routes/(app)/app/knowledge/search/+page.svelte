<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating } from '$app/state';
	import { pageTitle } from '#lib/brand.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { searchKnowledge } from '#lib/features/knowledge/api.js';
	import { searchCountLabel } from '#lib/features/knowledge/format.js';
	import ResultRow from '#lib/features/knowledge/ResultRow.svelte';
	import type { PageProps } from './$types';

	// Go: web/knowledge/search.templ SearchPage.
	let { data }: PageProps = $props();
	const i18n = useI18n();

	// Writable deriveds: "Show more" appends in place; a new search resets them.
	let hits = $derived(data.hits);
	let hasMore = $derived(data.hasMore);
	let loadingMore = $state(false);

	const countLabel = $derived(searchCountLabel(i18n, data.hits.length + data.offset, data.hasMore));
	const searching = $derived(navigating.to?.url.pathname === '/app/knowledge/search');

	function moreURL(): string {
		const q = new URLSearchParams({
			q: data.query,
			offset: String(data.offset + hits.length),
			limit: String(data.limit),
			append: '1'
		});
		return `/app/knowledge/search?${q}`;
	}

	async function showMore(e: MouseEvent) {
		e.preventDefault();
		if (loadingMore) return;
		loadingMore = true;
		try {
			const page = await searchKnowledge(data.query, { limit: data.limit, offset: data.offset + hits.length });
			hits = [...hits, ...page.hits];
			hasMore = page.hasMore;
		} catch {
			// Leave the link: following it still works.
		} finally {
			loadingMore = false;
		}
	}

	// Go: hx-trigger="input changed delay:300ms …, search" with hx-push-url.
	let timer: ReturnType<typeof setTimeout> | undefined;
	function schedule(value: string, delay: number) {
		clearTimeout(timer);
		timer = setTimeout(() => {
			const q = value.trim();
			if (q === data.query) return;
			goto(q ? `/app/knowledge/search?q=${encodeURIComponent(q)}` : '/app/knowledge/search', {
				reset: false
			});
		}, delay);
	}
	$effect(() => () => clearTimeout(timer));
</script>

<svelte:head><title>{pageTitle(i18n.t('knowledge.search.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl p-6 md:p-8">
	<header class="border-b border-hairline pb-6">
		<a
			href="/app/knowledge"
			class="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase hover:text-foreground"
		>
			{'← ' + i18n.t('knowledge.title')}
		</a>
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('knowledge.search.heading')}</h1>
		<p class="mt-1 text-sm leading-relaxed text-muted-foreground">{i18n.t('knowledge.search.intro')}</p>
	</header>
	<div class="mt-6">
		<form method="get" action="/app/knowledge/search" class="relative">
			<Input
				id="knowledge-search-page-input"
				name="q"
				value={data.query}
				type="search"
				placeholder={i18n.t('knowledge.search.ph')}
				autocomplete="off"
				aria-label={i18n.t('knowledge.search.aria')}
				oninput={(e) => schedule(e.currentTarget.value, 300)}
			/>
			{#if searching}
				<div class="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
					{i18n.t('knowledge.search.searching')}
				</div>
			{/if}
		</form>
	</div>
	<div id="knowledge-search-panel" class="mt-6">
		{#if data.query === ''}
			<p class="text-sm text-muted-foreground">{i18n.t('knowledge.search.prompt')}</p>
		{:else if hits.length === 0 && !data.append}
			<p class="text-sm text-muted-foreground">{i18n.t('knowledge.search.none')}</p>
		{:else}
			{#if !data.append}
				<p class="mb-3 font-mono text-[11px] text-muted-foreground tabular-nums">{countLabel}</p>
			{/if}
			<div
				id="knowledge-search-results-list"
				class="divide-y divide-hairline overflow-hidden rounded-md border border-hairline"
			>
				{#each hits as hit, i (i)}
					<div data-search-row="true"><ResultRow {hit} /></div>
				{/each}
				{#if hasMore}
					<div id="knowledge-search-tail" class="px-3 py-2">
						<a href={moreURL()} class="text-sm font-medium hover:underline" aria-busy={loadingMore} onclick={showMore}>
							{i18n.t('knowledge.search.more')}
						</a>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
