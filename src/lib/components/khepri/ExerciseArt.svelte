<!--
	The pose artwork for a catalog exercise (north-client exerciseart.Frames):
	three frames of one movement, cycled as a flipbook. The artwork is CC BY-SA
	4.0 — a page using this must also render <ExerciseArtCredit /> once.

	The frames are white-on-transparent SVGs used as a CSS mask over
	bg-current, so one asset serves both themes. Stacked rather than swapping
	one mask URL, so a cut never waits on a fetch; a hard cut rather than a
	crossfade, which would read as a double exposure.

	Only the first frame is drawn until the artwork is on screen: frames 2 and
	3 are added (and so fetched) the first time it scrolls into view, and the
	flipbook runs only while it is in view and the tab is visible. A training
	week renders dozens of these; the ones nobody is looking at stay still.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import AspectRatio from '#lib/components/ui/aspectratio/aspectratio.svelte';
	import { FRAME_COUNT, FRAME_MS, maskFor } from './exercise-art.js';
	import type { ExerciseArtProps } from './types.js';

	let { id, slug, name, class: className = '' }: ExerciseArtProps = $props();

	const i18n = useI18n();
	let frame = $state(1);
	let root: HTMLDivElement | undefined = $state();
	let inView = $state(false);
	let pageVisible = $state(true);
	// Set once, the first time the artwork is seen; from then on every frame
	// stays in the DOM so a cut never waits on a fetch.
	let primed = $state(false);
	const frames = $derived(primed ? Array.from({ length: FRAME_COUNT }, (_, i) => i + 1) : [1]);

	// Reduced motion: the first frame is a complete drawing on its own, and the
	// other two are never fetched.
	$effect(() => {
		if (!slug || !root) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const observer = new IntersectionObserver((entries) => {
			inView = entries.some((e) => e.isIntersecting);
			if (inView) primed = true;
		});
		observer.observe(root);
		const onVisibility = () => (pageVisible = !document.hidden);
		onVisibility();
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			observer.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});

	$effect(() => {
		if (!inView || !pageVisible) return;
		const timer = setInterval(() => {
			frame = (frame % FRAME_COUNT) + 1;
		}, FRAME_MS);
		return () => clearInterval(timer);
	});
</script>

{#if slug}
	<AspectRatio ratio="square" class={className}>
		<div {id} bind:this={root} class="text-foreground relative h-full w-full" role="img" aria-label={i18n.tf('layout.art.aria', name)}>
			{#each frames as n (n)}
				<span
					aria-hidden="true"
					class={['absolute inset-0 bg-current', frame === n ? 'opacity-100' : 'opacity-0']}
					style={maskFor(slug, n)}
				></span>
			{/each}
		</div>
	</AspectRatio>
{/if}
