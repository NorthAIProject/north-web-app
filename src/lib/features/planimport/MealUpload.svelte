<!--
	The meal plan upload page (north-client web/planimport/upload.templ,
	UploadPage with Kind Meal). Choosing or dropping a file submits the form.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import FileUpIcon from '@lucide/svelte/icons/file-up';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { tf } from '#lib/features/nutrition/view.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { Message } from './server.js';
	import { say } from './view.js';

	let { error }: { error?: Message } = $props();
	const i18n = useI18n();

	// planimport.Accepted; the server checks the bytes either way.
	const accept = '.pdf,.docx,.txt,.md,.csv,.tsv,.xlsx,.json,.jpg,.jpeg,.png,.webp,.heic,image/*';
	// The literal headers internal/planimport matches: never translated.
	const columns = 'day, meal, food, quantity, unit, protein, carbs, fat';

	let over = $state(false);
	let busy = $state(false);
	let formEl: HTMLFormElement | undefined = $state();
	let fileInput: HTMLInputElement | undefined = $state();

	function drop(event: DragEvent) {
		over = false;
		if (!event.dataTransfer?.files.length || !fileInput) return;
		fileInput.files = event.dataTransfer.files;
		formEl?.requestSubmit();
	}
</script>

<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('planimport.label')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('planimport.upload.title.meal')}</h1>
		<p class="text-muted-foreground mt-1 text-sm">
			{i18n.t('planimport.upload.intro')}
			{' ' + i18n.t('planimport.upload.intro.meal')}
		</p>
	</header>
	{#if error}
		<Alert.Root variant="destructive">
			<Alert.Description>{say(i18n, error)}</Alert.Description>
		</Alert.Root>
	{/if}
	<Card.Root>
		<Card.Content class="space-y-4 pt-6">
			<form
				bind:this={formEl}
				method="post"
				action="/app/nutrition/import"
				enctype="multipart/form-data"
				ondragover={(e) => {
					e.preventDefault();
					over = true;
				}}
				ondragleave={(e) => {
					e.preventDefault();
					over = false;
				}}
				ondrop={(e) => {
					e.preventDefault();
					drop(e);
				}}
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
					<FileUpIcon class="text-muted-foreground size-5" />
					<span class="text-sm font-medium">
						{busy ? i18n.t('planimport.upload.reading') : i18n.t('planimport.upload.drop')}
					</span>
					<!-- A hidden native input: the label is the drop target and the button. -->
					<input
						bind:this={fileInput}
						id="file"
						type="file"
						name="file"
						{accept}
						class="sr-only"
						disabled={busy}
						onchange={() => formEl?.requestSubmit()}
					/>
				</label>
			</form>
			<div class="text-muted-foreground space-y-1 text-xs">
				<p>{i18n.t('planimport.upload.formats')}</p>
				<p>{tf(i18n, 'planimport.upload.sheets', columns)}</p>
				<p>{i18n.t('planimport.upload.blank')}</p>
			</div>
		</Card.Content>
	</Card.Root>
	<Button href="/app/nutrition/plans" variant="ghost">{i18n.t('planimport.cancel')}</Button>
</div>
