<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import ImportReview from '#lib/features/training/ImportReview.svelte';
	import ImportUpload from '#lib/features/training/ImportUpload.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	const i18n = useI18n();
	const error = $derived(form?.errorKey ? i18n.t(form.errorKey) : (form?.error ?? ''));
</script>

<svelte:head>
	<title>{pageTitle(i18n.t(form?.draft ? 'planimport.review.title' : 'planimport.upload.title.workout'))}</title>
</svelte:head>

<!-- A refused save (posted to /review) comes back here through use:enhance with the draft and the reason. -->
{#if form?.draft}
	{#key form}
		<ImportReview draft={form.draft} {error} />
	{/key}
{:else}
	<ImportUpload {error} />
{/if}
