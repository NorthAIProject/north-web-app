<!-- Why a document needs attention (Go: web/knowledge problemBadge). -->
<script lang="ts">
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	let { kind }: { kind: string } = $props();
	const i18n = useI18n();

	const destructive = $derived(kind === 'failed' || kind === 'empty');
	const key = $derived(
		({ failed: 'failed', empty: 'empty', stale: 'stale', stuck: 'stuck' } as Record<string, string>)[kind] ?? 'outdated'
	);
</script>

<Badge variant={destructive ? 'destructive' : 'secondary'}>{i18n.t(`knowledge.status.${key}`)}</Badge>
