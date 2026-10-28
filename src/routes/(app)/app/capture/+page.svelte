<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import { useI18n } from '#lib/i18n/index.js';
	import CapturePanel from '#lib/features/capture/CapturePanel.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();
</script>

<svelte:head><title>{pageTitle(i18n.t('capture.heading'))}</title></svelte:head>

<div id="capture-panel">
	<CapturePanel initial={form?.capture ?? { text: data.text, returnTo: '' }} />
</div>
