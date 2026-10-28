<!-- What the library search box swaps in (Go: knowledgepages.SearchResults). -->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import ResultRow from './ResultRow.svelte';
	import type { KnowledgeHit } from './types.js';

	let { query, hits, hasMore }: { query: string; hits: KnowledgeHit[]; hasMore: boolean } = $props();
	const i18n = useI18n();
</script>

{#if query === ''}
	<!-- nothing typed yet; an empty region reads better than a prompt -->
{:else if hits.length === 0}
	<p class="mt-3 text-sm text-muted-foreground">{i18n.t('knowledge.results.none_inline')}</p>
{:else}
	<div class="mt-3 divide-y divide-hairline overflow-hidden rounded-md border border-hairline">
		{#each hits as hit, i (i)}
			<ResultRow {hit} />
		{/each}
	</div>
	{#if hasMore}
		<p class="mt-2">
			<a href="/app/knowledge/search?q={encodeURIComponent(query)}" class="text-sm font-medium hover:underline">
				{i18n.t('knowledge.results.all')}
			</a>
		</p>
	{/if}
{/if}
