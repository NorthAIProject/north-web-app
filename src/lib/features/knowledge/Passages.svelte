<!-- The passages behind one coach reply (Go: knowledgepages.Passages). -->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import ResultRow from './ResultRow.svelte';
	import type { KnowledgeHit } from './types.js';

	let { hits }: { hits: KnowledgeHit[] } = $props();
	const i18n = useI18n();
</script>

<div class="mt-2 divide-y divide-hairline overflow-hidden rounded-md border border-hairline">
	{#if hits.length === 0}
		<p class="px-3 py-2 text-xs text-muted-foreground">{i18n.t('knowledge.results.gone')}</p>
	{/if}
	{#each hits as hit, i (i)}
		<ResultRow {hit} />
	{/each}
</div>
