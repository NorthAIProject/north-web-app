<!--
	A conversation with its history and composer (Go: chat.Page).

	The live exchange (the user's echoed turn and the streaming coach bubble)
	is appended after the stored transcript while the coach writes; when the
	stream closes the page re-reads the conversation, as Go's "done" refresh
	did. A pending approval takes the composer's place, an answered one opens
	the resume stream, and a fresh reflection opens with the coach's question.
-->
<script lang="ts">
	import Markdown from '#lib/components/khepri/Markdown.svelte';
	import { mascot } from '#lib/components/khepri/mascot.svelte.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import ConversationMemories from '#lib/features/memories/ConversationMemories.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { components } from '#lib/api/generated/schema.js';
	import ApprovalCard from './ApprovalCard.svelte';
	import AttachmentThumbs from './AttachmentThumbs.svelte';
	import Bubble from './Bubble.svelte';
	import ChatHeader from './ChatHeader.svelte';
	import Composer from './Composer.svelte';
	import ConversationStarters from './ConversationStarters.svelte';
	import StreamingBubble from './StreamingBubble.svelte';
	import ThreadList from './ThreadList.svelte';
	import { ChatStream } from './chat.svelte.js';
	import { museUserBubble, proseClasses } from './classes.js';

	type Detail = components['schemas']['ConversationDetail'];
	type Summary = components['schemas']['ConversationSummary'];

	let {
		detail,
		list,
		stats,
		draft,
		timeZone
	}: {
		detail: Detail;
		list: Summary[];
		stats: { threadCount: number; messagesThisWeek: number };
		draft: string;
		timeZone: string;
	} = $props();

	const i18n = useI18n();

	const id = $derived(detail.conversation.id);
	const ended = $derived(detail.conversation.ended);
	const reflection = $derived(detail.conversation.kind === 'reflection');
	// Tool turns are what the model sees, not what the person reads.
	const messages = $derived(detail.messages.filter((m) => !m.toolTurn));
	const pending = $derived(detail.pendingApproval);

	const chat = new ChatStream(() => id);

	let threads = $state(false);
	// svelte-ignore state_referenced_locally
	let composerText = $state(draft);
	let root: HTMLDivElement | undefined = $state();
	let transcript: HTMLDivElement | undefined = $state();

	// A new conversation (client navigation between threads) starts clean.
	let shownFor = '';
	$effect.pre(() => {
		if (id === shownFor) return;
		shownFor = id;
		chat.close();
		chat.exchange = null;
		chat.composerError = '';
		composerText = draft;
		threads = false;
	});

	// The header's translated status copy (Go: data-status-*).
	$effect(() => {
		mascot.bindChatCopy({
			ready: i18n.t('chat.status.ready'),
			listening: i18n.t('chat.status.listening'),
			thinking: i18n.t('chat.status.thinking'),
			writing: i18n.t('chat.status.writing'),
			snag: i18n.t('chat.status.snag')
		});
	});

	// Owed streams open on sight, once per state of the conversation: a
	// reflection's first question, or the reply after an approval.
	let opened = '';
	$effect(() => {
		if (pending || chat.busy) return;
		let key = '';
		if (detail.awaitingResume) key = `${id}:resume:${detail.messages.length}`;
		else if (reflection && !ended && detail.messages.length === 0) key = `${id}:begin`;
		if (!key || key === opened) return;
		opened = key;
		if (key.endsWith(':begin')) void chat.begin();
		else void chat.resume();
	});

	$effect(() => () => chat.close());

	// Held to the visual viewport, so the composer stays above a phone's keyboard.
	$effect(() => {
		const vv = window.visualViewport;
		if (!vv || !root) return;
		const el = root;
		const fit = () => (el.style.height = vv.height + 'px');
		fit();
		vv.addEventListener('resize', fit);
		vv.addEventListener('scroll', fit);
		return () => {
			vv.removeEventListener('resize', fit);
			vv.removeEventListener('scroll', fit);
		};
	});

	// Kept scrolled to the bottom as content arrives.
	$effect(() => {
		if (!transcript) return;
		const el = transcript;
		const pin = () => (el.scrollTop = el.scrollHeight);
		pin();
		const observer = new MutationObserver(pin);
		observer.observe(el, { childList: true, subtree: true, characterData: true });
		return () => observer.disconnect();
	});

	function pickStarter(starter: string) {
		composerText = starter;
		document.getElementById('message')?.focus();
	}
</script>

<div id="chat-root" class="bg-muse-canvas flex h-full min-h-0" bind:this={root}>
	<ThreadList {list} current={id} {stats} bind:open={threads} />
	<!-- relative: the Muse header floats over the transcript. -->
	<div class="relative flex min-w-0 flex-1 flex-col">
		<ChatHeader {reflection} ontoggle={() => (threads = !threads)} />
		<div id="transcript" class="min-h-0 flex-1 overflow-y-auto" bind:this={transcript}>
			<!-- pt-[156px]: the first reply starts below the avatar and its pill. -->
			<div class="mx-auto w-full max-w-3xl space-y-4 px-4 pt-[156px] pb-6 sm:px-6">
				{#if messages.length === 0 && !(reflection && !ended) && !chat.exchange}
					<ConversationStarters onpick={pickStarter} />
				{:else}
					{#each messages as m (m.id)}
						<Bubble message={m} conversationId={id} {timeZone} />
					{/each}
				{/if}
				{#if chat.exchange}
					{#if chat.exchange.userText || chat.exchange.attachment}
						{@const a = chat.exchange.attachment}
						<div class="flex justify-end">
							<div class="{museUserBubble} space-y-2">{#if a}<AttachmentThumbs
										parts={[{ kind: a.kind, name: a.name, src: a.preview }]}
									/>{/if}{#if chat.exchange.userText}{chat.exchange.userText}{/if}</div>
						</div>
					{/if}
					<StreamingBubble text={chat.exchange.text} error={chat.exchange.error} streaming={chat.exchange.streaming} />
				{/if}
				{#if ended}
					<Card.Root class="border-hairline bg-surface">
						<Card.Header>
							<Card.Title>{i18n.t('chat.reflection.summary')}</Card.Title>
						</Card.Header>
						<Card.Content class={proseClasses}>
							<Markdown source={detail.summary ?? ''} />
						</Card.Content>
					</Card.Root>
					<ConversationMemories conversationId={id} />
				{/if}
			</div>
		</div>
		<!-- The card takes the composer's place while it is up. -->
		{#if pending}
			<ApprovalCard conversationId={id} approval={pending} />
		{:else if !ended}
			<Composer
				bind:value={composerText}
				error={chat.composerError}
				onsend={(text, file) => chat.send(text, file)}
			/>
		{/if}
	</div>
</div>
