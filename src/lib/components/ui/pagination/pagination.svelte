<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<nav
	bind:this={ref}
	aria-label="pagination"
	data-slot="pagination"
	class={cn("flex flex-wrap justify-center", className)}
	{...restProps}
>
	{@render children?.()}
</nav>
