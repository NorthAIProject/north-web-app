<!-- The index as a bar and a line of counts, not a card of KPIs (Go: indexMeter). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { meterLabel, meterWidth, runSummary } from './format.js';
	import type { IndexRun, KnowledgeCounts } from './types.js';

	let { counts, lastRun, timeZone }: { counts: KnowledgeCounts; lastRun?: IndexRun; timeZone: string } = $props();
	const i18n = useI18n();
</script>

<div class="w-full max-w-md space-y-2 lg:text-right">
	<div class="flex h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={meterLabel(i18n, counts)}>
		{#if counts.ready > 0}
			<div class="h-full bg-signal" style={meterWidth(counts.ready, counts)}></div>
		{/if}
		{#if counts.pending > 0}
			<div class="h-full bg-muted-foreground/40" style={meterWidth(counts.pending, counts)}></div>
		{/if}
		{#if counts.failed > 0}
			<div class="h-full bg-destructive" style={meterWidth(counts.failed, counts)}></div>
		{/if}
	</div>
	<div
		class="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground tabular-nums lg:justify-end"
	>
		<span><span class="text-foreground">{counts.ready}</span> {i18n.t('knowledge.meter.read')}</span>
		<span><span class="text-foreground">{counts.chunks ?? 0}</span> {i18n.t('knowledge.meter.passages')}</span>
		{#if counts.pending > 0}
			<span>{i18n.tf('knowledge.meter.waiting', counts.pending)}</span>
		{/if}
		{#if counts.failed > 0}
			<span class="text-destructive">{i18n.tf('knowledge.meter.unreadable', counts.failed)}</span>
		{/if}
	</div>
	<div class="flex flex-wrap items-center gap-3 lg:justify-end">
		{#if lastRun}
			<p class="text-xs text-muted-foreground">{runSummary(i18n, lastRun, timeZone)}</p>
		{/if}
		<form method="post" action="/app/knowledge?/reindex" use:enhance>
			<Button type="submit" size="sm" variant="ghost">{i18n.t('knowledge.rebuild')}</Button>
		</form>
	</div>
</div>
