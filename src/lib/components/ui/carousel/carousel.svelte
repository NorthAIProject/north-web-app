<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { CarouselState, setCarouselContext } from "./context.svelte.js";

	type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Current slide index (bindable). */
		index?: number;
		autoplay?: boolean;
		/** Autoplay interval in ms (default 5000). */
		interval?: number;
		loop?: boolean;
		onIndexChange?: (index: number) => void;
	};

	let {
		ref = $bindable(null),
		class: className,
		index = $bindable(0),
		autoplay = false,
		interval = 5000,
		loop = false,
		onIndexChange,
		children,
		...restProps
	}: Props = $props();

	const ctx = setCarouselContext(
		new CarouselState({
			loop: () => loop,
			onIndexChange: (i) => {
				index = i;
				onIndexChange?.(i);
			},
		}),
	);

	$effect.pre(() => {
		ctx.current = index;
	});

	let visible = $state(false);

	$effect(() => {
		if (!ref) return;
		const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
		io.observe(ref);
		return () => io.disconnect();
	});

	$effect(() => {
		if (!autoplay || !visible || ctx.hovered || ctx.dragOffset !== null) return;
		const id = setInterval(() => ctx.navigate(1), interval > 0 ? interval : 5000);
		return () => clearInterval(id);
	});
</script>

<div
	bind:this={ref}
	data-slot="carousel"
	role="region"
	aria-roledescription="carousel"
	class={cn("relative overflow-hidden w-full", className)}
	onmouseenter={() => (ctx.hovered = true)}
	onmouseleave={() => (ctx.hovered = false)}
	{...restProps}
>
	{@render children?.()}
</div>
