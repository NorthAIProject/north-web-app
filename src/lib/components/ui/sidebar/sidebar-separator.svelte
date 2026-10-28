<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<!-- templUI sidebar Separator: a plain border-t rule. -->
<div
	bind:this={ref}
	role="separator"
	data-slot="sidebar-separator"
	data-sidebar="separator"
	class={cn("mx-2 my-2 border-t border-sidebar-border", className)}
	{...restProps}
></div>
