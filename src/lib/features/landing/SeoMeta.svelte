<!--
	Link-preview tags every page carries (north-client layout.Base). A crawler
	fetches og:image on its own, with no page to resolve a relative path
	against, so both URLs are absolute — siteUrl, not the request's origin.

	og:url is the canonical origin rather than the current path: the pages that
	get shared are the public ones, and everything under /app is behind a
	session no crawler will ever hold.

	og:title and twitter:title follow the page's own title, so they live with
	it in PageTitle.svelte.
-->
<script lang="ts">
	import { productName, siteUrl, tagline } from '#lib/brand.js';

	const image = `${siteUrl}/assets/brand/og-card.png`;
</script>

<svelte:head>
	<meta name="description" content={tagline} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={productName} />
	<meta property="og:description" content={tagline} />
	<meta property="og:url" content={siteUrl} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={`${productName} — ${tagline}`} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:description" content={tagline} />
	<meta name="twitter:image" content={image} />
</svelte:head>
