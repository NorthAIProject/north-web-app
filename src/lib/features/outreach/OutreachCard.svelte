<!--
	Today's message from the coach (Go web/outreach Fragment), for My Day to
	mount where Go loaded hx-get="/app/outreach". It loads itself, renders
	nothing when the coach has not spoken today, and answers in place: the
	first answer is the one the coach suggests, the rest are outlined. An answer
	given elsewhere already (409/422) shows what is true now.

		<OutreachCard />
-->
<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { answerOutreach, outreachKeys, todayQuery } from './outreach.js';

	const i18n = useI18n();
	const client = useQueryClient();
	const today = createQuery(() => todayQuery());
	const o = $derived(today.data?.outreach);
	let busy = $state(false);

	async function answer(e: SubmitEvent) {
		e.preventDefault();
		const action = (e.submitter as HTMLButtonElement | null)?.value ?? '';
		if (!o || !action) return;
		busy = true;
		try {
			const next = await answerOutreach(o.id, action);
			client.setQueryData(outreachKeys.today, { outreach: next });
		} catch {
			await client.invalidateQueries({ queryKey: outreachKeys.today });
		} finally {
			busy = false;
		}
	}
</script>

<div id="coach-outreach">
	{#if o && o.body}
		<Card.Root class="border-signal/40" data-testid="coach-outreach">
			<Card.Content class="space-y-3 pt-5">
				<p class="text-signal flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
					<MessageCircleIcon class="size-3.5" />
					{i18n.t('outreach.title')}
				</p>
				<p class="text-sm leading-relaxed">{o.body}</p>
				{#if !o.action && o.actions.length > 0}
					<form method="post" action="/app/outreach/{o.id}/actions" class="flex flex-wrap gap-2" onsubmit={answer}>
						{#each o.actions as a, i (a)}
							<Button
								type="submit"
								size="sm"
								variant={i === 0 ? 'default' : 'outline'}
								name="action"
								value={a}
								disabled={busy}
								data-testid="outreach-{a}"
							>
								{i18n.t('outreach.action.' + a)}
							</Button>
						{/each}
					</form>
				{:else if o.outcome}
					<p class="text-muted-foreground flex items-center gap-1.5 text-xs" data-testid="outreach-outcome">
						<CheckIcon class="size-3.5" />
						{o.outcome}
					</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
