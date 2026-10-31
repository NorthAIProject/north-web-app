<!--
	The library: filter tabs, the inline search box and its results, and the
	document table (Go: libraryToolbar + #knowledge-search-results +
	documentLibrary). Filtering is client state, as Alpine's was.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import EmptyState from '#lib/components/khepri/EmptyState.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { inlineSearchLimit, searchKnowledge } from './api.js';
	import {
		filterCount,
		humanSize,
		readWhen,
		showsUnder,
		typeCode,
		fileTypeLabel,
		type LibraryFilter
	} from './format.js';
	import InlineResults from './InlineResults.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import type { KnowledgeDocument, KnowledgeHit } from './types.js';

	let { documents, timeZone }: { documents: KnowledgeDocument[]; timeZone: string } = $props();
	const i18n = useI18n();

	let filter = $state<LibraryFilter>('all');
	const tabs: { value: LibraryFilter; key: string }[] = [
		{ value: 'all', key: 'knowledge.filter.all' },
		{ value: 'notes', key: 'knowledge.filter.notes' },
		{ value: 'files', key: 'knowledge.filter.files' },
		{ value: 'waiting', key: 'knowledge.filter.waiting' }
	];

	// Go: hx-trigger="input changed delay:300ms, search" into #knowledge-search-results.
	// Enter submits the form to the search page, as it did without htmx.
	let results = $state<{ query: string; hits: KnowledgeHit[]; hasMore: boolean }>({ query: '', hits: [], hasMore: false });
	let lastSent = '';
	let timer: ReturnType<typeof setTimeout> | undefined;
	let inflight: AbortController | undefined;

	function schedule(value: string, delay: number) {
		clearTimeout(timer);
		timer = setTimeout(() => run(value.trim()), delay);
	}

	async function run(q: string) {
		if (q === lastSent) return;
		lastSent = q;
		inflight?.abort();
		if (q === '') {
			results = { query: '', hits: [], hasMore: false };
			return;
		}
		const ctrl = new AbortController();
		inflight = ctrl;
		try {
			const page = await searchKnowledge(q, { limit: inlineSearchLimit, signal: ctrl.signal });
			if (!ctrl.signal.aborted) results = { query: q, ...page };
		} catch {
			// A failed lookup leaves the last results; htmx did not swap on errors either.
			lastSent = '';
		}
	}

	$effect(() => () => {
		clearTimeout(timer);
		inflight?.abort();
	});
</script>

<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
	<div class="inline-flex h-9 w-fit items-center rounded-lg bg-muted p-[3px]">
		{#each tabs as tab (tab.value)}
			<button
				type="button"
				onclick={() => (filter = tab.value)}
				aria-pressed={filter === tab.value}
				class={[
					'inline-flex h-[calc(100%-1px)] items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors duration-150',
					filter === tab.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
				]}
			>
				{i18n.t(tab.key)}
				<span class="font-mono text-[10px] tabular-nums opacity-70">{filterCount(documents, tab.value)}</span>
			</button>
		{/each}
	</div>
	<div class="min-w-0 sm:max-w-xs sm:flex-1">
		<form method="get" action="/app/knowledge/search" class="flex gap-2">
			<div class="min-w-0 flex-1">
				<Input
					id="knowledge-search"
					name="q"
					type="search"
					placeholder={i18n.t('knowledge.search.ph')}
					autocomplete="off"
					aria-label={i18n.t('knowledge.search.aria')}
					oninput={(e) => schedule(e.currentTarget.value, 300)}
				/>
			</div>
		</form>
	</div>
</div>
<div id="knowledge-search-results" class="mt-4">
	<InlineResults query={results.query} hits={results.hits} hasMore={results.hasMore} />
</div>
<div class="mt-4">
	{#if documents.length === 0}
		<EmptyState mascot title={i18n.t('knowledge.empty.title')} body={i18n.t('knowledge.empty.body')}>
			<Button href="#add-note">{i18n.t('knowledge.empty.cta')}</Button>
		</EmptyState>
	{:else}
		<div class="overflow-x-auto rounded-md border border-hairline">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-12 pl-3">{i18n.t('knowledge.col.type')}</Table.Head>
						<Table.Head>{i18n.t('knowledge.col.name')}</Table.Head>
						<Table.Head class="hidden sm:table-cell">{i18n.t('knowledge.col.size')}</Table.Head>
						<Table.Head class="hidden md:table-cell">{i18n.t('knowledge.col.lines')}</Table.Head>
						<Table.Head>{i18n.t('knowledge.col.status')}</Table.Head>
						<Table.Head class="hidden lg:table-cell">{i18n.t('knowledge.col.read')}</Table.Head>
						<Table.Head class="w-0 pr-3 text-right">
							<span class="sr-only">{i18n.t('knowledge.col.actions')}</span>
						</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each documents as d (d.id)}
						<Table.Row hidden={!showsUnder(d, filter)}>
							<Table.Cell class="pl-3">
								<span
									class="inline-flex size-8 items-center justify-center rounded-md bg-muted font-mono text-[9px] font-medium tracking-wide text-muted-foreground"
									title={fileTypeLabel(i18n, d)}
								>
									{typeCode(i18n, d)}
								</span>
							</Table.Cell>
							<Table.Cell>
								<a href="/app/knowledge/{d.id}" class="font-medium hover:underline">{d.title}</a>
								{#if d.status === 'failed' && d.parseError}
									<p class="mt-0.5 text-xs text-destructive">{d.parseError}</p>
								{/if}
							</Table.Cell>
							<Table.Cell class="hidden text-muted-foreground tabular-nums sm:table-cell">
								{#if d.kind === 'upload' && d.byteSize > 0}
									{humanSize(i18n, d.byteSize)}
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="hidden text-muted-foreground tabular-nums md:table-cell">
								{#if (d.lineCount ?? 0) > 0}
									{d.lineCount}
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell><StatusBadge doc={d} /></Table.Cell>
							<Table.Cell class="hidden text-xs text-muted-foreground lg:table-cell">{readWhen(i18n, d, timeZone)}</Table.Cell>
							<Table.Cell class="pr-3 text-right">
								<form method="post" action="/app/knowledge/{d.id}?/delete" use:enhance>
									<Button type="submit" size="sm" variant="ghost">{i18n.t('knowledge.remove')}</Button>
								</form>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
