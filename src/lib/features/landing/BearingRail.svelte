<!--
	The page's one piece of hand-rolled chrome (north-client page.templ
	bearingRail + landing.js pageProgress): a scroll-linked axis, the horizon
	the product is sold on, filling as the reader travels it. Below lg it
	becomes a hairline of scroll progress pinned under the navbar.

	Drawn with a transform (scaleY / scaleX from one end) so a scroll never
	triggers layout, painted at most once a frame, and the page height is
	measured when it changes rather than on every scroll.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let progress = $state(0);

	onMount(() => {
		let max = 0;
		let frame = 0;
		const measure = () => {
			max = document.documentElement.scrollHeight - window.innerHeight;
		};
		const paint = () => {
			frame = 0;
			progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
		};
		const schedule = () => {
			if (!frame) frame = requestAnimationFrame(paint);
		};
		const remeasure = () => {
			measure();
			schedule();
		};
		// The body grows as images, the muscle model and fonts arrive; a
		// resize of the window alone would miss that.
		const observer = new ResizeObserver(remeasure);
		observer.observe(document.body);
		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', remeasure, { passive: true });
		remeasure();
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', remeasure);
		};
	});
</script>

<div aria-hidden="true" class="pointer-events-none absolute inset-y-0 left-10 hidden w-px bg-hairline lg:block">
	<div class="h-full w-px origin-top bg-signal/70 will-change-transform" style:transform="scaleY({progress})"></div>
</div>
<div
	aria-hidden="true"
	class="pointer-events-none fixed left-0 top-14 z-40 h-px w-full origin-left bg-signal/70 will-change-transform lg:hidden"
	style:transform="scaleX({progress})"
></div>
