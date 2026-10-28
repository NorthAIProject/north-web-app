<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { getCarouselContext } from "./context.svelte.js";

	type Props = WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "children">> & {
		/** Number of dots; defaults to the number of registered items. */
		count?: number;
	};

	let { ref = $bindable(null), class: className, count, ...restProps }: Props = $props();

	const carousel = getCarouselContext();
	const total = $derived(count ?? carousel.count);
</script>

<div
	bind:this={ref}
	data-slot="carousel-indicators"
	class={cn("absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2", className)}
	{...restProps}
>
	{#each { length: total }, i (i)}
		<button
			type="button"
			aria-label={`Go to slide ${i + 1}`}
			aria-current={i === carousel.current ? "true" : undefined}
			data-active={i === carousel.current}
			class={cn(
				"w-3 h-3 rounded-full hover:bg-foreground/50 focus:outline-none transition-colors",
				i === carousel.current ? "bg-primary" : "bg-foreground/30",
			)}
			onclick={() => carousel.goTo(i)}
		></button>
	{/each}
</div>
