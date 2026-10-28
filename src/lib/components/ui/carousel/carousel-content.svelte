<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { getCarouselContext } from "./context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();

	const carousel = getCarouselContext();

	let drag: { startX: number; currentX: number; startTime: number; width: number } | null = null;

	function onpointerdown(e: PointerEvent) {
		if (e.button !== 0 || !ref) return;
		e.preventDefault();
		ref.setPointerCapture(e.pointerId);
		drag = { startX: e.clientX, currentX: e.clientX, startTime: Date.now(), width: ref.offsetWidth || 1 };
		carousel.dragOffset = 0;
	}

	function onpointermove(e: PointerEvent) {
		if (!drag) return;
		drag.currentX = e.clientX;
		carousel.dragOffset = ((e.clientX - drag.startX) / drag.width) * 100;
	}

	function onpointerup(e: PointerEvent) {
		if (!drag) return;
		const diff = drag.startX - (e.clientX || drag.currentX);
		const velocity = Math.abs(diff) / Math.max(1, Date.now() - drag.startTime);
		drag = null;
		carousel.dragOffset = null;
		if (Math.abs(diff) > 50 || velocity > 0.5) carousel.navigate(diff > 0 ? 1 : -1);
	}

	const offset = $derived(-carousel.current * 100 + (carousel.dragOffset ?? 0));
</script>

<div
	bind:this={ref}
	data-slot="carousel-content"
	class={cn(
		"flex h-full w-full transition-transform duration-500 ease-in-out cursor-grab touch-pan-y",
		carousel.dragOffset !== null && "cursor-grabbing transition-none",
		className,
	)}
	style:transform={`translateX(${offset}%)`}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
	onpointercancel={onpointerup}
	{...restProps}
>
	{@render children?.()}
</div>
