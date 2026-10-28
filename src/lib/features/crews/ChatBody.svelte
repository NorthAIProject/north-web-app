<script lang="ts">
	import { tick, untrack } from 'svelte';
	import EmptyState from '#lib/components/khepri/EmptyState.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { isApiError } from '#lib/api/errors.js';
	import { useI18n } from '#lib/i18n/index.js';
	import * as crewApi from './api.js';
	import Composer from './Composer.svelte';
	import MessageRow from './MessageRow.svelte';
	import { continues, excerptOf, firstSeq, lastSeq, type CrewChannel, type CrewMessagePage } from './crew.js';

	// Go: web/crews/space.templ chatBody + messages.templ. The Go page kept a
	// hidden cursor input and let htmx append fragments; here the rows are
	// state and the cursor is the newest seq among them.
	let {
		crewID,
		channel,
		initial,
		me,
		manage,
		timeZone,
		onreport,
		onterms
	}: {
		crewID: string;
		channel: CrewChannel;
		/** The latest page, from the route load. The parent keys this component on the channel. */
		initial: CrewMessagePage;
		me: string;
		manage: boolean;
		timeZone?: string;
		onreport: (messageID: string) => void;
		onterms: () => void;
	} = $props();

	const i18n = useI18n();
	let messages = $state(untrack(() => initial.messages));
	let hasMore = $state(untrack(() => initial.hasMore ?? false));
	let cursor = $derived(lastSeq(messages));
	let scroller = $state<HTMLDivElement | null>(null);
	let composer = $state<ReturnType<typeof Composer> | null>(null);
	// The transcript stays pinned to the bottom while the reader is near it,
	// and leaves them alone once they scroll up to read.
	let near = true;

	// One fetch of what is new at a time; a request asked for while one is in
	// flight runs once after it, with the cursor as it is then (hx-sync queue last).
	let loading: Promise<void> | null = null;
	let again = false;

	/** Appends what arrived after the cursor (Go: #crew-tail on crew-new / crew-sent). */
	export function loadNew(): Promise<void> {
		if (loading) {
			again = true;
			return loading;
		}
		loading = (async () => {
			do {
				again = false;
				const page = await crewApi.getMessages(crewID, channel.id, { after: cursor });
				const seen = new Set(messages.map((m) => m.id));
				const fresh = page.messages.filter((m) => !seen.has(m.id));
				if (fresh.length) await append(fresh);
			} while (again);
		})().finally(() => (loading = null));
		return loading;
	}

	async function append(fresh: typeof messages) {
		const stick = near;
		messages = [...messages, ...fresh];
		await tick();
		if (stick && scroller) scroller.scrollTop = scroller.scrollHeight;
		scheduleRead();
	}

	/** The latest page again, after a resync. The composer is untouched, so a half-typed message survives. */
	export async function reload(): Promise<void> {
		const page = await crewApi.getMessages(crewID, channel.id);
		messages = page.messages;
		hasMore = page.hasMore ?? false;
		await tick();
		if (scroller) scroller.scrollTop = scroller.scrollHeight;
	}

	/** One row again after the stream said it changed; gone when the viewer may no longer see it. */
	export async function refreshMessage(id: string): Promise<void> {
		if (!messages.some((m) => m.id === id)) return;
		const m = await crewApi.getMessage(crewID, id);
		messages = m ? messages.map((x) => (x.id === id ? m : x)) : messages.filter((x) => x.id !== id);
	}

	/** Takes a row off the page, after the viewer reported it. */
	export function drop(id: string) {
		messages = messages.filter((m) => m.id !== id);
	}

	async function older() {
		const before = firstSeq(messages);
		const page = await crewApi.getMessages(crewID, channel.id, { before });
		// Rows arrive above the reader: hold the distance from the bottom so
		// the message they were on stays in place.
		const fromBottom = scroller ? scroller.scrollHeight - scroller.scrollTop : 0;
		const seen = new Set(messages.map((m) => m.id));
		messages = [...page.messages.filter((m) => !seen.has(m.id)), ...messages];
		hasMore = page.hasMore ?? false;
		await tick();
		if (scroller) scroller.scrollTop = scroller.scrollHeight - fromBottom;
	}

	// Marks the channel read while the page is in front of the person: on
	// load, a second after each new message, and on coming back to the tab.
	let readTimer: ReturnType<typeof setTimeout> | undefined;
	function markRead() {
		if (cursor > 0) crewApi.markRead(crewID, channel.id, cursor).catch(() => {});
	}
	function scheduleRead() {
		if (document.visibilityState !== 'visible') return;
		clearTimeout(readTimer);
		readTimer = setTimeout(markRead, 1000);
	}

	$effect(() => {
		untrack(markRead);
		if (scroller) scroller.scrollTop = scroller.scrollHeight;
		const onVisible = () => document.visibilityState === 'visible' && markRead();
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			document.removeEventListener('visibilitychange', onVisible);
			clearTimeout(readTimer);
		};
	});

	function onscroll() {
		if (scroller) near = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 120;
	}

	/** The words of a refused post (Go: refusePost, ComposerRefusal). */
	function refusal(err: unknown): string {
		if (!isApiError(err)) return (err as Error).message;
		if (err.code === 'terms_required') {
			onterms();
			return i18n.t('crews.err.terms');
		}
		if (err.code === 'suspended') return i18n.t('crews.err.suspended');
		return Object.values(err.fields)[0] ?? err.message;
	}

	async function send(input: { body: string; replyToId?: string; clientId?: string }): Promise<string> {
		try {
			await crewApi.sendMessage(crewID, channel.id, input);
		} catch (err) {
			return refusal(err);
		}
		near = true;
		await loadNew();
		return '';
	}

	async function save(id: string, body: string): Promise<string> {
		try {
			const m = await crewApi.editMessage(crewID, id, body);
			messages = messages.map((x) => (x.id === id ? m : x));
			return '';
		} catch (err) {
			if (isApiError(err) && err.status === 403) return i18n.t('crews.err.suspended');
			if (isApiError(err)) return Object.values(err.fields)[0] ?? err.message;
			throw err;
		}
	}

	/** A write the page does not redraw from: the row is fetched again, as the stream would. */
	async function act(id: string, write: () => Promise<void>) {
		await write();
		await refreshMessage(id);
	}

	async function block(userID: string) {
		await crewApi.block(userID);
		// Everything the blocked person wrote leaves the page.
		window.location.reload();
	}
</script>

<div id="crew-scroll" class="min-h-0 flex-1 overflow-y-auto" bind:this={scroller} {onscroll}>
	{#if hasMore}
		<div id="crew-older" class="flex justify-center py-2">
			<Button type="button" variant="ghost" size="sm" onclick={older}>{i18n.t('crews.load-older')}</Button>
		</div>
	{/if}
	<div id="crew-messages" class="pb-2">
		{#if messages.length === 0}
			<EmptyState title={i18n.t('crews.empty.title')} body={i18n.t('crews.empty.body')} />
		{/if}
		{#each messages as m, i (m.id)}
			<MessageRow
				{m}
				compact={i > 0 && continues(messages[i - 1], m)}
				{me}
				{manage}
				{timeZone}
				onreact={(emoji, on) => act(m.id, () => crewApi.react(crewID, m.id, emoji, on))}
				onpin={(on) => act(m.id, () => crewApi.pin(crewID, m.id, on))}
				ondelete={() => act(m.id, () => crewApi.deleteMessage(crewID, m.id))}
				onreply={() => composer?.replyTo({ id: m.id, name: m.author?.name ?? '', excerpt: excerptOf(m.body ?? '') })}
				onreport={() => onreport(m.id)}
				onblock={() => m.author && block(m.author.id)}
				onsave={(body) => save(m.id, body)}
			/>
		{/each}
	</div>
</div>
<Composer bind:this={composer} channelName={channel.name ?? ''} onsend={send} />
