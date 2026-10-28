<script lang="ts">
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { getCarouselContext } from "./context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithElementRef<Omit<HTMLButtonAttributes, "children">> = $props();

	const carousel = getCarouselContext();
</script>

<button
	bind:this={ref}
	type="button"
	data-slot="carousel-next"
	aria-label="Next slide"
	disabled={!carousel.canNext}
	class={cn(
		"absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 focus:outline-none",
		!carousel.canNext && "opacity-50",
		className,
	)}
	onclick={() => carousel.navigate(1)}
	{...restProps}
>
	<ChevronRightIcon />
</button>
