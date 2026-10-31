<!--
	Whether a reply helped (Go: MessageFeedback). A real form with an action,
	so the rating records without JavaScript; with it, only this control
	changes. The answered state always offers a way back.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	let { messageId, helpful: initial }: { messageId: string; helpful?: boolean | null } = $props();

	const i18n = useI18n();
	// svelte-ignore state_referenced_locally
	let helpful = $state<boolean | null | undefined>(initial);
	$effect(() => {
		helpful = initial;
	});
</script>

{#snippet answer(value: 'helpful' | 'unhelpful' | 'clear', label: string)}
	<form
		method="post"
		action="?/helpful"
		class="inline"
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') {
					const rated = (result.data as { rated?: { helpful?: boolean } } | undefined)?.rated;
					helpful = rated?.helpful ?? null;
					return;
				}
				await update();
			}}
	>
		<input type="hidden" name="messageId" value={messageId} />
		<input type="hidden" name="answer" {value} />
		<Button
			type="submit"
			variant="ghost"
			size="sm"
			class="text-muted-foreground hover:text-foreground h-8 px-2 text-xs pointer-coarse:min-h-11">{label}</Button
		>
	</form>
{/snippet}

<!-- Hover-revealed only where there is hover (Bubble's group); touch always sees it. -->
<div id="feedback-{messageId}" class="flex flex-wrap items-center gap-1" data-testid="feedback">
	{#if helpful === true || helpful === false}
		<span class="text-muted-foreground px-1 text-xs">
			{helpful ? i18n.t('chat.feedback.helpful') : i18n.t('chat.feedback.nothelpful')}
		</span>
		{@render answer('clear', i18n.t('chat.feedback.undo'))}
	{:else}
		<span
			class="text-muted-foreground px-1 text-xs transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
		>
			{i18n.t('chat.feedback.ask')}
		</span>
		<span
			class="flex gap-1 transition-opacity focus-within:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
		>
			{@render answer('helpful', i18n.t('chat.feedback.yes'))}
			{@render answer('unhelpful', i18n.t('chat.feedback.no'))}
		</span>
	{/if}
</div>
