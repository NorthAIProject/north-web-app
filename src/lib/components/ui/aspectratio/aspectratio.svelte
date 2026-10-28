<script lang="ts" module>
	export type AspectRatioRatio = "auto" | "square" | "video" | "portrait" | "wide";

	const ratioClasses: Record<AspectRatioRatio, string> = {
		auto: "aspect-auto",
		square: "aspect-square",
		video: "aspect-video",
		portrait: "aspect-[3/4]",
		wide: "aspect-[2/1]",
	};
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		ratio = "auto",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { ratio?: AspectRatioRatio } = $props();
</script>

<div
	bind:this={ref}
	data-slot="aspect-ratio"
	class={cn("relative w-full", ratioClasses[ratio] ?? "aspect-auto", className)}
	{...restProps}
>
	<div class="absolute inset-0">
		{@render children?.()}
	</div>
</div>
