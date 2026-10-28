<!--
	The coach's two counters (Go: coachKpiStrip). Not KpiStrip: that goes to
	five columns at lg, and two labels in a fifth of 240px ran into each other.
-->
<script lang="ts">
	import KpiCell from '#lib/components/khepri/KpiCell.svelte';
	import { useI18n } from '#lib/i18n/index.js';

	let { stats }: { stats: { threadCount: number; messagesThisWeek: number } } = $props();

	const i18n = useI18n();
</script>

<div class="border-hairline bg-surface/60 grid grid-cols-2 gap-3 rounded-lg border p-4">
	<KpiCell label={i18n.t('chat.kpi.threads')} value={String(stats.threadCount)} />
	<KpiCell label={i18n.t('chat.kpi.messages')} value={String(stats.messagesThisWeek)} />
</div>
