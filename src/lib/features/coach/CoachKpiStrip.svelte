<!--
	The coach's two counters (Go: coachKpiStrip), as one ruled KpiStrip row.
	The strip is a list on a phone and a row from md; two cells share the
	column's width, so the labels never run into each other.
-->
<script lang="ts">
	import KpiCell from '#lib/components/khepri/KpiCell.svelte';
	import KpiStrip from '#lib/components/khepri/KpiStrip.svelte';
	import { useI18n } from '#lib/i18n/index.js';

	let { stats }: { stats: { threadCount: number; messagesThisWeek: number } } = $props();

	const i18n = useI18n();
</script>

<KpiStrip>
	<KpiCell label={i18n.t('chat.kpi.threads')} value={String(stats.threadCount)} />
	<KpiCell label={i18n.t('chat.kpi.messages')} value={String(stats.messagesThisWeek)} />
</KpiStrip>
