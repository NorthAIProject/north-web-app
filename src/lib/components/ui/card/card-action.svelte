<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
	// Not in templUI. templUI's card header is a flex column (no action grid),
	// so this just right-aligns inside it; put it in your own flex row for a
	// title-left/action-right layout.
</script>

<div
	bind:this={ref}
	data-slot="card-action"
	class={cn("self-end", className)}
	{...restProps}
>
	{@render children?.()}
</div>
