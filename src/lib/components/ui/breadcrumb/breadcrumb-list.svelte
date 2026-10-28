<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLOlAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLOlAttributes> = $props();
</script>

<ol
	bind:this={ref}
	data-slot="breadcrumb-list"
	class={cn("flex items-center flex-wrap gap-1 text-sm", className)}
	{...restProps}
>
	{@render children?.()}
</ol>
