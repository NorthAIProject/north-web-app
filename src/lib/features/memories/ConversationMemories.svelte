<!--
	What a finished reflection proposed to remember, each with Save / Skip
	(Go: memories.ConversationPending, loaded from /app/memories/for/{id} and
	re-rendered after each verdict). Renders nothing while loading, on failure
	and once every proposal has a verdict — as the Go fragment did.

	<ConversationMemories conversationId={c.id} />
-->
<script lang="ts">
	import { browserApi } from '#lib/api/client.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { Memory } from './view.js';

	let { conversationId }: { conversationId: string } = $props();

	const i18n = useI18n();
	let pending: Memory[] = $state([]);
	let busy = $state(false);

	async function load(id: string) {
		const { data } = await browserApi().GET('/memories/for/{conversationID}', {
			params: { path: { conversationID: id } }
		});
		pending = data?.pending ?? [];
	}

	$effect(() => {
		const id = conversationId;
		load(id).catch(() => (pending = []));
	});

	async function verdict(m: Memory, action: 'approve' | 'reject') {
		busy = true;
		try {
			const path = action === 'approve' ? '/memories/{memoryID}/approve' : '/memories/{memoryID}/reject';
			await browserApi().POST(path, { params: { path: { memoryID: m.id } } });
		} catch {
			// Go re-rendered the list either way; a failed verdict leaves the chip.
		}
		try {
			await load(conversationId);
		} catch {
			pending = pending.filter((p) => p.id !== m.id);
		} finally {
			busy = false;
		}
	}
</script>

<div id="reflection-memories">
	{#if pending.length > 0}
		<div class="space-y-3">
			<p class="text-sm font-medium">{i18n.t('memories.reflection.ask')}</p>
			{#each pending as m (m.id)}
				<Card.Root class="border-hairline">
					<Card.Content class="space-y-3 py-4">
						<p class="text-sm">{m.content}</p>
						<div class="flex flex-wrap gap-2">
							<Button
								type="button"
								size="sm"
							
								disabled={busy}
								onclick={() => verdict(m, 'approve')}
							>
								{i18n.t('memories.reflection.save')}
							</Button>
							<Button type="button" size="sm" variant="outline" disabled={busy} onclick={() => verdict(m, 'reject')}>
								{i18n.t('memories.reflection.skip')}
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
