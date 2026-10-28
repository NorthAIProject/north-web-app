<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import MealReview from '#lib/features/planimport/MealReview.svelte';
	import MealUpload from '#lib/features/planimport/MealUpload.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	const i18n = useI18n();
</script>

<svelte:head>
	<title>{pageTitle(i18n.t(form?.review ? 'planimport.review.title' : 'planimport.upload.title.meal'))}</title>
</svelte:head>

{#if form?.review}
	<MealReview view={form.review} />
{:else}
	<MealUpload error={form?.upload?.error} />
{/if}
