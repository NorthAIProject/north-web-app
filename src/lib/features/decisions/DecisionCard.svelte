<!-- One logged decision in the list (Go: decisions.decisionCard). -->
<script lang="ts">
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { heldLabel, type Decision } from './form.js';

	let { decision: d, timeZone }: { decision: Decision; timeZone?: string } = $props();
	const i18n = useI18n();
</script>

<Card.Root class="border-hairline">
	<Card.Content class="space-y-2 py-4">
		<p class="text-muted-foreground text-xs">{formatTime(i18n.locale, d.decidedAt, '2 Jan 2006', timeZone)}</p>
		<h3 class="text-sm font-medium">{d.title}</h3>
		{#if d.options}
			<p class="text-muted-foreground text-sm">{i18n.tf('decisions.card.options', d.options)}</p>
		{/if}
		{#if d.rationale}
			<p class="text-muted-foreground text-sm">{i18n.tf('decisions.card.why', d.rationale)}</p>
		{/if}
		{#if d.outcome}
			<p class="text-muted-foreground text-sm">{i18n.tf('decisions.card.outcome', d.outcome)}</p>
		{/if}
		{#if d.held}
			<p class="text-muted-foreground text-sm">{i18n.tf('decisions.card.held', heldLabel(i18n, d.held))}</p>
		{/if}
		<Button href="/app/decisions/{d.id}" variant="ghost" size="sm">{i18n.t('decisions.edit')}</Button>
	</Card.Content>
</Card.Root>
