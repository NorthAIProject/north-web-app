<!--
	The Khepri companion (north-client mascot.Mascot): the robotic scarab of
	the 2026-10-30 brand (docs/brand/README.md), posed by data-state and moved
	by CSS (.north-mascot in app.css).

	<Mascot id="onboarding" size="lg" state="listening" />
	<Mascot size="md" gesture="celebrate" />

	Props only say how a mascot starts; reactive state comes from
	mascot.setState() in mascot.svelte.ts. The image is decorative: every
	surface it appears on already names the product.
-->
<script lang="ts">
	import { gestureOrEmpty, isGestureState, registerMascot, stateOrDefault, sustainedState } from './mascot.svelte.js';
	import type { MascotProps, MascotSize } from './types.js';

	let { id = '', size = 'md', state: initialState = 'idle', gesture = '', class: className = '' }: MascotProps =
		$props();

	// Square so the three sizes stay interchangeable; the scarab letterboxes.
	function boxClass(s: MascotSize): string {
		switch (s) {
			case 'lg':
				return 'size-40 sm:size-48';
			case 'sm':
				return 'size-8';
			default:
				return 'size-24';
		}
	}

	// CSS width of each box, so the browser picks the smallest image that is
	// still sharp: sm is the chat avatar, lg the onboarding hero.
	function sizesFor(s: MascotSize): string {
		switch (s) {
			case 'lg':
				return '(min-width: 40rem) 12rem, 10rem';
			case 'sm':
				return '2rem';
			default:
				return '6rem';
		}
	}

	// SSR renders the declared pose, as the Go template does.
	// svelte-ignore state_referenced_locally
	let current = $state(stateOrDefault(initialState));
	let img: HTMLImageElement | undefined = $state();

	$effect(() => {
		const registered = registerMascot({
			id,
			initial: stateOrDefault(initialState),
			gesture: gestureOrEmpty(gesture),
			set: (s) => (current = s)
		});
		current = registered.state;
		return registered.destroy;
	});

	function onAnimationEnd(event: AnimationEvent) {
		if (event.target !== img) return;
		if (!isGestureState(current)) return;
		// A cancelled hop can fire animationend after a newer pose took over;
		// only hand back when this event belongs to the pose showing now.
		if (event.animationName !== 'khepri-' + current) return;
		current = sustainedState();
	}
</script>

<div
	id={id || undefined}
	class={'north-mascot relative shrink-0 ' + boxClass(size as MascotSize) + ' ' + className}
	data-state={current}
>
	<img
		bind:this={img}
		src="/assets/brand/solar/mascot/khepri-idle-320.webp"
		srcset="/assets/brand/solar/mascot/khepri-idle-160.webp 160w, /assets/brand/solar/mascot/khepri-idle-320.webp 320w, /assets/brand/solar/mascot/khepri-idle-590.webp 590w"
		sizes={sizesFor(size as MascotSize)}
		width="320"
		height="320"
		alt=""
		aria-hidden="true"
		class="size-full object-contain"
		decoding="async"
		onanimationend={onAnimationEnd}
	/>
</div>
