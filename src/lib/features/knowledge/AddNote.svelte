<!--
	The compose rail: drop a file or write a note (Go: addNote + uploadDrop).
	Both are real forms posting to the page's actions, so they work before
	hydration; use:enhance keeps the page in place afterwards.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import FileUp from '@lucide/svelte/icons/file-up';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import DictateField from '#lib/features/voice/DictateField.svelte';
	import type { NoteForm } from './types.js';

	let { form }: { form?: NoteForm | null } = $props();
	const i18n = useI18n();

	const errorOf = (name: string) => form?.errors?.[name] ?? '';

	let over = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let uploading = $state(false);
	let saving = $state(false);

	function drop(e: DragEvent) {
		e.preventDefault();
		over = false;
		if (!fileInput || !e.dataTransfer?.files.length) return;
		fileInput.files = e.dataTransfer.files;
		fileInput.form?.requestSubmit();
	}
</script>

<div class="space-y-5">
	<div>
		<h2 class="text-sm font-medium">{i18n.t('knowledge.add.title')}</h2>
		<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{i18n.t('knowledge.add.formats')}</p>
	</div>
	<form
		method="post"
		action="/app/knowledge?/upload"
		enctype="multipart/form-data"
		class="space-y-2"
		ondragover={(e) => {
			e.preventDefault();
			over = true;
		}}
		ondragleave={(e) => {
			e.preventDefault();
			over = false;
		}}
		ondrop={drop}
		use:enhance={({ formElement }) => {
			uploading = true;
			return async ({ result, update }) => {
				if (result.type === 'redirect') formElement.reset();
				await update();
				uploading = false;
			};
		}}
	>
		<label
			for="file"
			aria-busy={uploading}
			class={[
				'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition-colors duration-150',
				over ? 'border-signal bg-signal/8' : 'border-hairline bg-surface'
			]}
		>
			<FileUp class="size-5 text-muted-foreground" />
			<span class="text-sm font-medium">{i18n.t('knowledge.drop.title')}</span>
			<span class="text-xs text-muted-foreground">{i18n.t('knowledge.drop.formats')}</span>
			<!-- Hidden native input: a styled Input cannot sit inside a drop target without drawing its own field chrome. -->
			<input
				bind:this={fileInput}
				id="file"
				type="file"
				name="file"
				accept=".pdf,.md,.markdown,.txt,.text,.log,.csv,application/pdf"
				class="sr-only"
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
			/>
		</label>
		{#if errorOf('file')}
			<p class="text-[0.8rem] font-medium text-red-500">{errorOf('file')}</p>
		{/if}
	</form>
	<Separator />
	<form
		method="post"
		action="/app/knowledge?/note"
		class="space-y-3"
		use:enhance={({ formElement }) => {
			saving = true;
			return async ({ result, update }) => {
				// Go answered a saved note with a fresh page: an empty form.
				if (result.type === 'redirect') formElement.reset();
				await update();
				saving = false;
			};
		}}
	>
		<div class="space-y-2">
			<Label for="title" class={errorOf('title') ? 'text-destructive' : ''}>{i18n.t('knowledge.add.note_label')}</Label>
			<Input
				id="title"
				name="title"
				value={form?.title ?? ''}
				placeholder={i18n.t('knowledge.add.title_ph')}
				aria-invalid={errorOf('title') ? true : undefined}
			/>
			{#if errorOf('title')}
				<p class="text-[0.8rem] font-medium text-red-500">{errorOf('title')}</p>
			{/if}
		</div>
		<div class="space-y-2">
			<DictateField target="body">
				<Textarea
					id="body"
					name="body"
					rows={5}
					placeholder={i18n.t('knowledge.add.body_ph')}
					value={form?.body ?? ''}
					aria-invalid={errorOf('body') ? true : undefined}
				/>
			</DictateField>
			{#if errorOf('body')}
				<p class="text-[0.8rem] font-medium text-red-500">{errorOf('body')}</p>
			{/if}
		</div>
		<Button type="submit" class="w-full bg-signal text-background hover:bg-signal/90" disabled={saving}>
			{i18n.t('knowledge.add.save')}
		</Button>
	</form>
</div>
