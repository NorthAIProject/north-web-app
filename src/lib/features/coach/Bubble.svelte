<!--
	One stored turn (Go: Bubble). The coach is named once, in the header pill,
	not on every reply.
-->
<script lang="ts">
	import Markdown from '#lib/components/khepri/Markdown.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import ExerciseMuscles from '#lib/features/exercises/ExerciseMuscles.svelte';
	import Sources from '#lib/features/knowledge/Sources.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import AttachmentThumbs from './AttachmentThumbs.svelte';
	import MessageFeedback from './MessageFeedback.svelte';
	import { museAgentBubble, museCaption, museUserBubble, proseBody } from './classes.js';
	import { captionText, sourceLabel, type ChatMessage } from './copy.js';

	let { message: m, conversationId, timeZone }: { message: ChatMessage; conversationId: string; timeZone: string } =
		$props();

	const i18n = useI18n();
	let copied = $state(false);

	const thumbs = $derived(
		(m.attachments ?? [])
			.filter((a) => a.mediaId)
			.map((a) => ({ kind: a.kind, name: a.name, src: `/api/conversations/${conversationId}/attachments/${a.mediaId}` }))
	);

	function copy() {
		void navigator.clipboard.writeText(m.text);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

{#if m.role === 'user'}
	<div class="flex justify-end" data-role="user">
		<div class={museUserBubble}><AttachmentThumbs parts={thumbs} />{#if m.text.trim()}{m.text}{/if}</div>
	</div>
{:else}
	<div class="group flex flex-col items-start gap-1" data-role="coach">
		{#if m.proactive}
			<p class="{museCaption} ml-1" data-proactive-caption>{captionText(i18n, m, timeZone)}</p>
		{/if}
		<div class="{museAgentBubble} {proseBody}"><Markdown source={m.text} /></div>
		{#each m.exercises ?? [] as slug (slug)}
			<ExerciseMuscles {slug} />
		{/each}
		{#if (m.sourceCount ?? 0) > 0 && m.evidenceRefs?.length}
			<div class="ml-1 w-full max-w-[94%]">
				<Sources refs={m.evidenceRefs} label={sourceLabel(i18n, m.sourceCount ?? 0)} />
			</div>
		{/if}
		<!-- Revealed on hover only where there is hover; touch always sees them. -->
		<div class="-ml-1 flex flex-wrap items-center gap-1">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onclick={copy}
				class="text-muted-foreground hover:text-foreground h-8 px-2 text-xs transition-opacity focus-visible:opacity-100 pointer-coarse:min-h-11 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
			>
				{copied ? i18n.t('chat.copied') : i18n.t('chat.copy')}
			</Button>
			<MessageFeedback messageId={m.id} helpful={m.helpful} />
		</div>
	</div>
{/if}
