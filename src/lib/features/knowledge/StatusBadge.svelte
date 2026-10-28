<!-- A document's indexing state (Go: web/knowledge statusBadge). -->
<script lang="ts">
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { KnowledgeDocument } from './types.js';

	let { doc }: { doc: KnowledgeDocument } = $props();
	const i18n = useI18n();
</script>

{#if doc.status === 'ready'}
	{#if doc.stale}
		<Badge variant="secondary">{i18n.t('knowledge.status.stale')}</Badge>
	{:else}
		<Badge variant="outline" class="border-signal/40 bg-signal/12 text-signal">{i18n.t('knowledge.status.read')}</Badge>
	{/if}
{:else if doc.status === 'failed'}
	<Badge variant="destructive">{i18n.t('knowledge.status.failed')}</Badge>
{:else}
	<Badge variant="secondary">{i18n.t('knowledge.status.waiting')}</Badge>
{/if}
