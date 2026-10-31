<!-- A fact the coach proposed, waiting for Approve / Discard (Go: memories.pendingCard). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { categoryLabel, proposesSupersession, type Memory } from './view.js';

	let { memory: m }: { memory: Memory } = $props();

	const i18n = useI18n();
	const replaces = $derived(proposesSupersession(m));
</script>

<Card.Root class="border-hairline" data-memory={m.id}>
	<Card.Content class="space-y-3 py-4">
		<div class="flex flex-wrap items-center gap-2">
			<Badge variant="outline">{categoryLabel(i18n, m.category)}</Badge>
			<Badge variant="secondary">{i18n.t('memories.badge.proposed')}</Badge>
			{#if replaces}
				<Badge variant="outline" class="border-signal/40 bg-signal/12 text-signal-text">{i18n.t('memories.badge.replaces')}</Badge>
			{/if}
		</div>
		<p class="text-sm">{m.content}</p>
		{#if replaces}
			<p class="text-xs text-muted-foreground">{i18n.t('memories.replaces.body')}</p>
		{/if}
		<div class="flex flex-wrap gap-2">
			<form method="post" action="?/approve" use:enhance>
				<input type="hidden" name="id" value={m.id} />
				<Button type="submit" size="sm">
					{i18n.t('memories.approve')}
				</Button>
			</form>
			<form method="post" action="?/reject" use:enhance>
				<input type="hidden" name="id" value={m.id} />
				<Button type="submit" size="sm" variant="outline">{i18n.t('memories.discard')}</Button>
			</form>
		</div>
	</Card.Content>
</Card.Root>
