<!--
	The page's one piece of hand-rolled chrome (north-client page.templ
	bearingRail + landing.js pageProgress): a scroll-linked axis, the horizon
	the product is sold on, filling as the reader travels it. Below lg it
	becomes a hairline of scroll progress pinned under the navbar.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let progress = $state(0);

	onMount(() => {
		const update = () => {
			const max = document.documentElement.scrollHeight - window.innerHeight;
			progress = (max > 0 ? Math.min(1, window.scrollY / max) : 0) * 100;
		};
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update, { passive: true });
		update();
		return () => {
			window.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
		};
	});
</script>

<div aria-hidden="true" class="pointer-events-none absolute inset-y-0 left-10 hidden w-px bg-hairline lg:block">
	<div class="w-px bg-signal/70 transition-[height] duration-150 ease-out" style:height="{progress}%"></div>
</div>
<div
	aria-hidden="true"
	class="pointer-events-none fixed left-0 top-14 z-40 h-px bg-signal/70 lg:hidden"
	style:width="{progress}%"
></div>
