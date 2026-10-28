<!--
	The message box (Go: composer + ComposerError). Enter sends, shift+Enter
	makes a new line. A photo shows as a thumbnail and any other file as its
	name. Focus here is what "Khepri is listening" means (data-muse-listen).
-->
<script lang="ts">
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import PaperclipIcon from '@lucide/svelte/icons/paperclip';
	import XIcon from '@lucide/svelte/icons/x';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import Dictate from '#lib/features/voice/Dictate.svelte';
	import { useI18n } from '#lib/i18n/index.js';

	let {
		value = $bindable(''),
		error = '',
		onsend
	}: {
		value?: string;
		error?: string;
		onsend: (text: string, file: File | null) => Promise<{ sent: boolean; draft?: string }>;
	} = $props();

	const i18n = useI18n();

	let fileInput: HTMLInputElement | undefined = $state();
	let file: File | null = $state(null);
	let preview = $state('');
	let fileName = $state('');

	function pick(f: File | undefined) {
		file = f ?? null;
		const photo = !!f && f.type.startsWith('image/');
		preview = photo ? URL.createObjectURL(f) : '';
		fileName = f && !photo ? f.name : '';
	}

	function clearFile() {
		if (fileInput) fileInput.value = '';
		pick(undefined);
	}

	async function submit(event?: SubmitEvent) {
		event?.preventDefault();
		const text = value;
		const chosen = file;
		// Go reset the form once the POST answered; the words are already
		// echoed into the transcript by then.
		const sending = onsend(text, chosen);
		const result = await sending;
		if (result.sent) {
			value = '';
			clearFile();
		} else if (result.draft !== undefined) {
			value = result.draft;
		}
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
			event.preventDefault();
			void submit();
		}
	}
</script>

{#if error}
	<p class="text-destructive px-4 pb-2 text-sm" role="alert">{error}</p>
{/if}
<div class="pb-[max(0.75rem,env(safe-area-inset-bottom))]">
	<form class="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 pt-3 pb-3" onsubmit={submit} data-testid="composer">
		{#if preview}
			<img src={preview} alt="" class="h-16 w-16 rounded-lg object-cover" />
		{/if}
		{#if fileName}
			<div class="flex items-center gap-1">
				<Badge variant="secondary" class="max-w-full gap-1.5 py-1">
					<PaperclipIcon class="size-3" />
					<span class="truncate">{fileName}</span>
				</Badge>
				<Button type="button" size="icon" variant="ghost" class="size-7" aria-label={i18n.t('chat.attach_remove')} onclick={clearFile}>
					<XIcon class="size-3.5" />
				</Button>
			</div>
		{/if}
		<div class="flex items-end gap-2">
			<!-- Hidden input + icon: the control stays a 44px thumb target. -->
			<input
				bind:this={fileInput}
				type="file"
				name="attachment"
				id="attachment"
				accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.docx,.xlsx,.csv,.tsv,.txt,.md,.json"
				class="sr-only"
				onchange={(e) => pick((e.currentTarget as HTMLInputElement).files?.[0])}
			/>
			<Button
				type="button"
				variant="outline"
				size="icon"
				class="min-h-11 min-w-11"
				aria-label={i18n.t('chat.attach')}
				onclick={() => fileInput?.click()}
			>
				<PaperclipIcon class="size-4" />
			</Button>
			<!-- Fills the box and stops there; the person sends it. -->
			<Dictate target="message" variant="outline" />
			<Textarea
				id="message"
				name="message"
				placeholder={i18n.t('chat.placeholder')}
				bind:value
				rows={1}
				autoResize
				class="bg-muse-pill dark:bg-muse-pill max-h-48 min-h-11 resize-none rounded-[24px] border-transparent px-4 py-2.5 text-[15px] shadow-none md:text-[15px]"
				data-muse-listen=""
				{onkeydown}
			/>
			<Button type="submit" size="icon" class="min-h-11 min-w-11">
				<ArrowUpIcon class="size-4" />
			</Button>
		</div>
	</form>
</div>
