<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';

	// The first stop on the page: jumps past the navigation to <main id="main">.
	// Hidden until focused. Focus is moved by hand because a client-side router
	// may scroll to a hash without moving focus there; without JS the plain
	// #main fragment does the same job.
	let { target = 'main' }: { target?: string } = $props();
	const i18n = useI18n();

	function skip(event: MouseEvent) {
		const el = document.getElementById(target);
		if (!el) return;
		event.preventDefault();
		el.focus();
		el.scrollIntoView({ block: 'start' });
	}
</script>

<a
	href="#{target}"
	onclick={skip}
	class="sr-only z-50 rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground shadow-md focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
>
	{i18n.t('layout.skip')}
</a>
