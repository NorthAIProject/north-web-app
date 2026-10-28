<!--
	The document title and its link-preview twins (north-client layout.Base):
	"Privacy · Khepri", or just "Khepri" for the home page.
-->
<script lang="ts">
	import { pageTitle } from '#lib/brand.js';

	let { title = '' }: { title?: string } = $props();
	const full = $derived(pageTitle(title));
</script>

<svelte:head>
	<title>{full}</title>
	<meta property="og:title" content={full} />
	<meta name="twitter:title" content={full} />
</svelte:head>
