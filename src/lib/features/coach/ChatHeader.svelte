<!--
	The Muse header (Go: chatHeader): a 56px bar with the thread-list toggle
	and delete on the left, "New chat" on the right, and Khepri's avatar
	hanging over the transcript with a name-and-status pill.

	Invariant: the one mascot that reacts to the coach lives here. Its phase
	and status line come from mascotChat, which the stream drives.
-->
<script lang="ts">
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { enhance } from '$app/forms';
	import Mascot from '#lib/components/khepri/Mascot.svelte';
	import { mascotChat } from '#lib/components/khepri/mascot.svelte.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import StartForm from './StartForm.svelte';

	let { reflection, ontoggle }: { reflection: boolean; ontoggle: () => void } = $props();

	const i18n = useI18n();
	const status = $derived(mascotChat.status || i18n.t('chat.status.ready'));
</script>

<header class="muse-header pointer-events-none absolute inset-x-0 top-0 z-20">
	<div class="muse-scrim" aria-hidden="true"></div>
	<div class="relative flex h-14 items-center justify-between gap-2 px-3">
		<div class="pointer-events-auto flex items-center gap-1">
			<Button
				type="button"
				variant="secondary"
				size="icon"
				class="relative size-10 rounded-full shadow-none after:absolute after:-inset-0.5 after:content-[''] lg:hidden"
				aria-label={i18n.t('chat.threads.aria')}
				onclick={ontoggle}
			>
				<PanelLeftIcon class="size-4" />
			</Button>
			<!-- A conversation is memory: deleting one takes a second, deliberate action. -->
			<form
				method="post"
				action="?/delete"
				use:enhance={({ cancel }) => {
					if (!confirm(i18n.t('chat.delete.confirm'))) cancel();
				}}
			>
				<Button
					type="submit"
					variant="ghost"
					size="icon"
					class="text-muted-foreground hover:text-destructive relative size-10 rounded-full after:absolute after:-inset-0.5 after:content-['']"
					aria-label={i18n.t('chat.delete.aria')}
				>
					<Trash2Icon class="size-4" />
				</Button>
			</form>
		</div>
		<StartForm class="pointer-events-auto">
			<Button type="submit" variant="secondary" size="sm" class="h-10 rounded-full px-4 shadow-none">
				<!-- The icon drops on phones: the avatar needs the width. -->
				<PlusIcon class="size-4 max-sm:hidden" />
				{i18n.t('chat.header.new')}
			</Button>
		</StartForm>
	</div>
	<div class="muse-identity" data-phase={mascotChat.phase}>
		<span class="muse-ring" aria-hidden="true"></span>
		<div class="muse-avatar">
			<Mascot id="chat-mascot" size="lg" />
		</div>
		<div class="muse-pill">
			<span class="muse-pill-name">
				Khepri
				{#if reflection}
					<Badge variant="secondary" class="ml-1.5 align-middle">{i18n.t('chat.reflection')}</Badge>
				{/if}
			</span>
			<span id="chat-status" class="muse-pill-status" aria-live="polite">{status}</span>
		</div>
	</div>
</header>
