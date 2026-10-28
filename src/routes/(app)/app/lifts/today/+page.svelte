<!--
	Go served GET /app/lifts/today only as the set logger's htmx fragment (for
	the training plan page). Here the card is a self-loading component; this
	route shows it on its own so the URL still leads somewhere.
-->
<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import TodayCard from '#lib/features/lifts/TodayCard.svelte';
	import { useI18n } from '#lib/i18n/index.js';

	const i18n = useI18n();
</script>

<svelte:head><title>{pageTitle(i18n.t('lifts.today.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl p-6 md:p-8">
	<TodayCard />
</div>
