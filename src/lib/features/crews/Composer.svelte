<script lang="ts">
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ReplyIcon from '@lucide/svelte/icons/reply';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { Reply } from './crew.js';

	// Go: web/crews/composer.templ. A sent message is not appended from the
	// response: onsend resolves and the transcript asks for what is new, so a
	// message reaches the page by the one path every message takes.
	let {
		channelName,
		onsend
	}: {
		channelName: string;
		/** Resolves to the refusal's words, or "" when it was sent. */
		onsend: (input: { body: string; replyToId?: string; clientId?: string }) => Promise<string>;
	} = $props();

	const i18n = useI18n();
	let body = $state('');
	let reply = $state<Reply | null>(null);
	let problem = $state('');
	let sending = $state(false);
	let textarea = $state<HTMLTextAreaElement | null>(null);
	// One id per message, so a repeated submit is stored once.
	let cid = $state(newID());

	function newID(): string {
		return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '';
	}

	/** Called by a row's Reply. */
	export function replyTo(r: Reply) {
		reply = r;
		textarea?.focus();
	}

	async function submit(event?: SubmitEvent) {
		event?.preventDefault();
		if (sending) return;
		sending = true;
		const refusal = await onsend({
			body,
			...(reply ? { replyToId: reply.id } : {}),
			...(cid ? { clientId: cid } : {})
		});
		sending = false;
		problem = refusal;
		if (!refusal) {
			body = '';
			reply = null;
			cid = newID();
		}
	}

	function keydown(event: KeyboardEvent) {
		// Enter sends, shift+Enter makes a new line.
		if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
			event.preventDefault();
			submit();
		}
	}

	const placeholder = $derived(i18n.tf('crews.composer.placeholder', channelName));
</script>

<form
	id="crew-composer"
	class="border-border flex flex-col gap-1 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
	onsubmit={submit}
>
	{#if reply}
		<div class="text-muted-foreground flex items-center gap-2 text-xs">
			<ReplyIcon class="size-3" />
			<span class="min-w-0 flex-1 truncate">
				<span>{i18n.tf('crews.composer.replying', reply.name)}</span>
				<span class="opacity-70">{reply.excerpt}</span>
			</span>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				class="size-8 pointer-coarse:size-11"
				aria-label={i18n.t('crews.composer.cancel-reply')}
				onclick={() => (reply = null)}
			>
				<XIcon class="size-4" />
			</Button>
		</div>
	{/if}
	<div class="flex items-end gap-2">
		<Textarea
			id="crew-body"
			name="body"
			rows={1}
			autoResize
			bind:ref={textarea}
			bind:value={body}
			{placeholder}
			class="max-h-48 min-h-11 resize-none"
			maxlength={4000}
			aria-label={placeholder}
			onkeydown={keydown}
		/>
		<Button type="submit" size="icon" class="min-h-11 min-w-11" aria-label={i18n.t('crews.composer.send')}>
			<ArrowUpIcon class="size-4" />
		</Button>
	</div>
	<div id="crew-composer-error" class="text-destructive text-xs" role="alert">
		{#if problem}<p>{problem}</p>{/if}
	</div>
</form>
