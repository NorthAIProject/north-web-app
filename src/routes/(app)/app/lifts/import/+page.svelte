<script lang="ts">
	import FileUpIcon from '@lucide/svelte/icons/file-up';
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	const i18n = useI18n();

	const errMsg = $derived(form?.error ?? (form?.errorKey ? i18n.t(form.errorKey) : ''));
	const result = $derived(form && 'result' in form ? form.result : null);

	let over = $state(false);
	let busy = $state(false);
	let formEl: HTMLFormElement | undefined = $state();
	let fileEl: HTMLInputElement | undefined = $state();

	function drop(event: DragEvent) {
		event.preventDefault();
		over = false;
		if (!fileEl || !event.dataTransfer?.files.length) return;
		fileEl.files = event.dataTransfer.files;
		// enhance marks the form busy once the file is in the FormData.
		formEl?.requestSubmit();
	}
</script>

<svelte:head><title>{pageTitle(i18n.t('lifts.import.page'))}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('lifts.import.label')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('lifts.import.title')}</h1>
		<p class="text-muted-foreground mt-1 text-sm">{i18n.t('lifts.import.lede')}</p>
	</header>
	{#if errMsg}
		<Alert.Root variant="destructive">
			<Alert.Description>{errMsg}</Alert.Description>
		</Alert.Root>
	{/if}
	{#if result}
		<Alert.Root>
			<Alert.Title>
				{#if result.workouts === 0 && result.duplicates > 0}
					{i18n.t('lifts.result.already')}
				{:else}
					{i18n.tf('lifts.result.imported', result.workouts, result.sets)}
				{/if}
			</Alert.Title>
			<Alert.Description>
				<ul class="space-y-1" data-testid="import-result">
					{#if result.duplicates > 0}
						<li>{i18n.tf('lifts.result.duplicates', result.duplicates)}</li>
					{/if}
					{#if result.skipped > 0}
						<li>{i18n.tf('lifts.result.skipped', result.skipped)}</li>
					{/if}
					{#if result.unmatched.length > 0}
						<li>
							{i18n.t('lifts.result.unmatched')}
							{#each result.unmatched as name, i (i)}{#if i > 0}{', '}{/if}<span class="text-foreground">{name}</span>{/each}
						</li>
					{/if}
				</ul>
			</Alert.Description>
		</Alert.Root>
	{/if}
	<Card.Root>
		<Card.Content class="space-y-4 pt-6">
			<!-- A drop target over the same multipart form the file input submits. -->
			<form
				bind:this={formEl}
				method="post"
				action="/app/lifts/import"
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
					<FileUpIcon class="text-muted-foreground size-5" />
					<span class="text-sm font-medium">{busy ? i18n.t('lifts.import.busy') : i18n.t('lifts.import.drop')}</span>
					<input
						bind:this={fileEl}
						id="file"
						type="file"
						name="file"
						accept=".csv,text/csv"
						class="sr-only"
						disabled={busy}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
					/>
				</label>
			</form>
			<ol class="text-muted-foreground list-decimal space-y-1 pl-4 text-xs">
				<li>{i18n.t('lifts.import.step1')}</li>
				<li>{i18n.t('lifts.import.step2')}</li>
				<li>{i18n.t('lifts.import.step3')}</li>
			</ol>
		</Card.Content>
	</Card.Root>
	<Button href="/app/training" variant="ghost">{i18n.t('lifts.import.back')}</Button>
</div>
