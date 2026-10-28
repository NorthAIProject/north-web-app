<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "#lib/utils.js";
	import DropdownMenuPortal from "./dropdown-menu-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		align = "start",
		alignOffset = 0,
		sideOffset = -4,
		portalProps,
		...restProps
	}: DropdownMenuPrimitive.SubContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DropdownMenuPortal>>;
	} = $props();
</script>

<DropdownMenuPortal {...portalProps}>
	<DropdownMenuPrimitive.SubContent
		bind:ref
		data-slot="dropdown-menu-sub-content"
		{align}
		{alignOffset}
		{sideOffset}
		class={cn(
			// templUI SubContent: right-start, offset -4.
		"z-[9999] m-0 min-w-[8rem] max-w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-lg outline-none transition-opacity duration-150 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none",
			className
		)}
		{...restProps}
	/>
</DropdownMenuPortal>
