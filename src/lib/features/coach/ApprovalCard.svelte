<!--
	Asks before Khepri changes anything (Go: ApprovalCard). One create_watch
	whose arguments parse reads as a standing task; anything else shows the
	calls in words.

	The tools run inside the decide request, which can take minutes for a new
	training plan, and finish server-side even if this request is dropped.
	So while it runs both buttons are disabled and the header says Khepri is
	at work; and if the request fails without an answer (a timeout, a dropped
	connection) or answers that the approval is already being resolved, the
	card keeps polling the conversation until the turn has moved on, then the
	page re-reads it and the resumed reply streams in.
-->
<script lang="ts">
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { createQuery } from '@tanstack/svelte-query';
	import { enhance, type SubmitFunction } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { browserApi } from '#lib/api/client.js';
	import { mascot } from '#lib/components/khepri/mascot.svelte.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { museCaption } from './classes.js';
	import { capitalise, humanSchedule } from './copy.js';
	import type { Approval } from './stream.js';

	let { conversationId, approval }: { conversationId: string; approval: Approval } = $props();

	const i18n = useI18n();
	const watch = $derived(approval.calls.length === 1 ? approval.calls[0].watch : undefined);

	let deciding: '' | 'approve' | 'decline' = $state('');
	let waiting = $state(false);

	const resolution = createQuery(
		() => ({
			queryKey: ['conversation', conversationId, 'approval', approval.messageId],
			queryFn: async () => {
				const { data } = await browserApi().GET('/conversations/{id}', { params: { path: { id: conversationId } } });
				return data!;
			},
			enabled: waiting,
			refetchInterval: 3000,
			retry: true,
			gcTime: 0
		})
	);

	// The turn moved on (or the card is stale): re-read the page.
	$effect(() => {
		const detail = resolution.data;
		if (!waiting || !detail) return;
		if (detail.pendingApproval?.messageId !== approval.messageId) {
			waiting = false;
			void invalidate('north:chat');
		}
	});

	const decide: SubmitFunction = ({ formData }) => {
		deciding = formData.get('decision') === 'decline' ? 'decline' : 'approve';
		mascot.streamOpened();
		return async ({ result, update }) => {
			if (result.type === 'redirect') {
				await update();
				return;
			}
			// 409 already resolving / 404 moved on / no answer at all: the
			// write may still be running server-side. Wait for it.
			waiting = true;
		};
	};
</script>

{#snippet decision(value: 'approve' | 'decline', label: string, variant: 'default' | 'outline' | 'ghost', cls: string, formClass = '')}
	<form method="post" action="?/decide" class={formClass || undefined} use:enhance={decide}>
		<input type="hidden" name="messageId" value={approval.messageId} />
		<input type="hidden" name="decision" value={value} />
		<Button type="submit" {variant} class={cls} disabled={deciding !== '' || waiting} aria-busy={deciding === value}>
			{label}
		</Button>
	</form>
{/snippet}

{#if watch}
	<div class="px-4 pb-4 sm:px-6" data-standing-task-card>
		<div class="mx-auto flex w-full max-w-3xl flex-col items-start gap-1">
			<p class="{museCaption} ml-1">{i18n.t('chat.caption.standing')}</p>
			<Card.Root class="bg-muse-agent text-foreground border-hairline max-w-[94%] rounded-2xl shadow-none dark:border-transparent">
				<Card.Header class="space-y-1 p-4 pb-0">
					<Card.Title class="text-[15px] leading-snug font-semibold">{capitalise(watch.title)}</Card.Title>
					<Card.Description class="text-[13px]">{humanSchedule(i18n, watch)}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-1 px-4 pt-3 pb-0 text-[15px] leading-normal">
					<p>{watch.spec}</p>
					<p class="text-muted-foreground text-[13px]">{i18n.tf('chat.watch.when', watch.condition)}</p>
				</Card.Content>
				<Card.Footer class="flex-wrap gap-2 p-4">
					{@render decision('approve', i18n.t('chat.watch.confirm'), 'default', 'min-h-11 rounded-full px-5')}
					{@render decision('decline', i18n.t('chat.watch.notnow'), 'ghost', 'min-h-11 rounded-full px-5')}
				</Card.Footer>
			</Card.Root>
		</div>
	</div>
{:else}
	<div class="border-border border-t p-4" data-testid="approval-card">
		<Alert.Root>
			<TriangleAlertIcon class="size-4" />
			<Alert.Title>{i18n.t('chat.approval.title')}</Alert.Title>
			<Alert.Description>
				<ul class="mt-1 space-y-1">
					{#each approval.calls as call, i (i)}
						<li class="font-mono text-xs">{call.summary}</li>
					{/each}
				</ul>
			</Alert.Description>
		</Alert.Root>
		<div class="mt-3 flex gap-2">
			{@render decision('approve', i18n.t('chat.approval.yes'), 'default', 'min-h-11 w-full', 'flex-1')}
			{@render decision('decline', i18n.t('chat.approval.no'), 'outline', 'min-h-11 w-full', 'flex-1')}
		</div>
	</div>
{/if}
