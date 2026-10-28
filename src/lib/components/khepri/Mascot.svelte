<!--
	The Khepri companion (north-client mascot.Mascot): the brand scarab PNG,
	posed by data-state and moved by CSS (.north-mascot in app.css).

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
		src="/assets/brand/khepri-mascot.png"
		alt=""
		aria-hidden="true"
		class="size-full object-contain"
		onanimationend={onAnimationEnd}
	/>
</div>
