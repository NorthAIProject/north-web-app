<!--
	The training plan import's upload page (north-client planimport
	upload.templ UploadPage with Kind = workout): a drop target that posts the
	file to the parse action.
-->
<script lang="ts">
	import FileUp from '@lucide/svelte/icons/file-up';
	import { enhance } from '$app/forms';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	let { error = '' }: { error?: string } = $props();
	const i18n = useI18n();

	// Mirrors planimport.Accepted; the server checks the bytes either way.
	const accept = '.pdf,.docx,.txt,.md,.csv,.tsv,.xlsx,.json,.jpg,.jpeg,.png,.webp,.heic,image/*';
	// The literal headers internal/planimport matches: English in every language.
	const columns = 'day, exercise, sets, reps, load, rest, notes';

	let over = $state(false);
	let busy = $state(false);
	let form: HTMLFormElement | undefined = $state();
	let input: HTMLInputElement | undefined = $state();

	function drop(event: DragEvent) {
		event.preventDefault();
		over = false;
		if (!input || !form || !event.dataTransfer?.files.length) return;
		input.files = event.dataTransfer.files;
		form.requestSubmit();
	}
</script>

<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('planimport.label')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('planimport.upload.title.workout')}</h1>
		<p class="text-muted-foreground mt-1 text-sm">{i18n.t('planimport.upload.intro')}</p>
	</header>
	{#if error}
		<Alert.Root variant="destructive">
			<Alert.Description>{error}</Alert.Description>
		</Alert.Root>
	{/if}
	<Card.Root>
		<Card.Content class="space-y-4 pt-6">
			<form
				bind:this={form}
				method="post"
				action="/app/training/import"
				enctype="multipart/form-data"
				ondragover={(e) => {
					e.preventDefault();
					over = true;
				}}
				ondragleave={(e) => {
					e.preventDefault();
					over = false;
				}}
				ondrop={drop}
				use:enhance={() => {
					busy = true;
					return async ({ update }) => {
						await update();
						busy = false;
					};
				}}
			>
				<label
					for="file"
					class={[
						'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-10 text-center transition-colors duration-150',
						over ? 'border-signal bg-signal/8' : 'border-hairline bg-surface'
					]}
				>
					<FileUp class="text-muted-foreground size-5" />
					<span class="text-sm font-medium">
						{busy ? i18n.t('planimport.upload.reading') : i18n.t('planimport.upload.drop')}
					</span>
					<!-- Hidden native input: an Input cannot sit inside a drop target without its own chrome. -->
					<input
						bind:this={input}
						id="file"
						type="file"
						name="file"
						{accept}
						class="sr-only"
						disabled={busy}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
					/>
				</label>
			</form>
			<div class="text-muted-foreground space-y-1 text-xs">
				<p>{i18n.t('planimport.upload.formats')}</p>
				<p>{i18n.tf('planimport.upload.sheets', columns)}</p>
				<p>{i18n.t('planimport.upload.blank')}</p>
			</div>
		</Card.Content>
	</Card.Root>
	<Button href="/app/training" variant="ghost">{i18n.t('planimport.cancel')}</Button>
</div>
