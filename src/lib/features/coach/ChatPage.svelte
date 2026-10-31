<!--
	A conversation with its history and composer (Go: chat.Page).

	The live exchange (the user's echoed turn and the streaming coach bubble)
	is appended after the stored transcript while the coach writes; when the
	stream closes the page re-reads the conversation, as Go's "done" refresh
	did. A pending approval takes the composer's place, an answered one opens
	the resume stream, and a fresh reflection opens with the coach's question.

	The API returns every turn, so only the latest window is drawn; "Show
	earlier" reveals more of what is already loaded. The finished reply is
	read out once through a polite live region (the streaming bubble itself
	is not live, or a screen reader would read it token by token).
-->
<script lang="ts">
	import { tick } from 'svelte';
	import Markdown from '#lib/components/khepri/Markdown.svelte';
	import { mascot } from '#lib/components/khepri/mascot.svelte.js';
	import { Button } from '#lib/components/ui/button/index.js';
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
	import { latest, TRANSCRIPT_WINDOW } from './transcript.js';

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
	let limit = $state(TRANSCRIPT_WINDOW);
	const drawn = $derived(latest(messages, limit));

	const chat = new ChatStream(() => id);

	let threads = $state(false);
	// svelte-ignore state_referenced_locally
	let composerText = $state(draft);
	let root: HTMLDivElement | undefined = $state();
	let transcript: HTMLDivElement | undefined = $state();
	// The transcript follows new content while the reader is at the bottom,
	// and leaves them alone once they scroll up to read.
	let near = true;

	// A new conversation (client navigation between threads) starts clean.
	let shownFor = '';
	$effect.pre(() => {
		if (id === shownFor) return;
		shownFor = id;
		chat.close();
		chat.exchange = null;
		chat.composerError = '';
		chat.announced = '';
		composerText = draft;
		threads = false;
		limit = TRANSCRIPT_WINDOW;
		near = true;
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

	// Ends at the bottom of the visual viewport, so the composer stays above
	// a phone's keyboard. The shell's bar sits above the page, so the height
	// is measured from where the page starts, and never past its parent.
	$effect(() => {
		const vv = window.visualViewport;
		if (!vv || !root) return;
		const el = root;
		const fit = () => {
			const visible = vv.offsetTop + vv.height - el.getBoundingClientRect().top;
			const room = el.parentElement?.clientHeight ?? visible;
			el.style.height = Math.max(0, Math.min(room, visible)) + 'px';
		};
		fit();
		vv.addEventListener('resize', fit);
		vv.addEventListener('scroll', fit);
		return () => {
			vv.removeEventListener('resize', fit);
			vv.removeEventListener('scroll', fit);
			el.style.height = '';
		};
	});

	// Kept scrolled to the bottom as content arrives, while the reader is near it.
	$effect(() => {
		if (!transcript) return;
		const el = transcript;
		const pin = () => {
			if (near) el.scrollTop = el.scrollHeight;
		};
		const onscroll = () => (near = el.scrollHeight - el.scrollTop - el.clientHeight < 120);
		pin();
		const observer = new MutationObserver(pin);
		observer.observe(el, { childList: true, subtree: true, characterData: true });
		el.addEventListener('scroll', onscroll, { passive: true });
		return () => {
			observer.disconnect();
			el.removeEventListener('scroll', onscroll);
		};
	});

	/** Draws the next window of earlier turns, holding the reader's place. */
	async function showEarlier() {
		const el = transcript;
		const fromBottom = el ? el.scrollHeight - el.scrollTop : 0;
		limit += TRANSCRIPT_WINDOW;
		await tick();
		if (!el) return;
		el.scrollTop = el.scrollHeight - fromBottom;
		// The button is gone once everything shows; focus stays in the transcript.
		if (!document.getElementById('chat-show-earlier')) el.focus({ preventScroll: true });
	}

	function send(text: string, file: File | null) {
		near = true;
		return chat.send(text, file);
	}

	function pickStarter(starter: string) {
		composerText = starter;
		document.getElementById('message')?.focus();
	}
</script>

<div id="chat-root" class="bg-muse-canvas flex h-full min-h-0" bind:this={root}>
	<h1 class="sr-only">{detail.conversation.title || i18n.t('nav.coach')}</h1>
	<ThreadList {list} current={id} {stats} bind:open={threads} />
	<!-- relative: the Muse header floats over the transcript. -->
	<div class="relative flex min-w-0 flex-1 flex-col">
		<ChatHeader {reflection} threadsOpen={threads} ontoggle={() => (threads = !threads)} />
		<div id="transcript" class="min-h-0 flex-1 overflow-y-auto outline-none" tabindex="-1" bind:this={transcript}>
			<!-- pt-[156px]: the first reply starts below the avatar and its pill.
				 On a short viewport the avatar sits in the 56px bar (app.css). -->
			<div class="mx-auto w-full max-w-3xl space-y-4 px-4 pt-[156px] pb-6 sm:px-6 [@media(max-height:32rem)]:pt-20">
				{#if messages.length === 0 && !(reflection && !ended) && !chat.exchange}
					<ConversationStarters onpick={pickStarter} />
				{:else}
					{#if drawn.hidden > 0}
						<div class="flex justify-center">
							<Button id="chat-show-earlier" type="button" variant="ghost" size="sm" onclick={showEarlier}>
								{i18n.t('chat.show-earlier')}
							</Button>
						</div>
					{/if}
					{#each drawn.shown as m (m.id)}
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
				onsend={send}
			/>
		{/if}
		<!-- The finished reply, once, when the stream closes (chat.announced). -->
		<p class="sr-only" aria-live="polite" aria-atomic="true">
			{chat.announced ? i18n.tf('chat.reply.announce', chat.announced) : ''}
		</p>
	</div>
</div>
