<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import { useI18n } from '#lib/i18n/index.js';

	const i18n = useI18n();
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.my-day'))}</title></svelte:head>
<div class="p-6 text-sm text-muted-foreground">My Day is being ported.</div>
