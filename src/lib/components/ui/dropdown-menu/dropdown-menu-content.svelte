<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "#lib/utils.js";
	import DropdownMenuPortal from "./dropdown-menu-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		sideOffset = 4,
		align = "start",
		portalProps,
		class: className,
		...restProps
	}: DropdownMenuPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DropdownMenuPortal>>;
	} = $props();
</script>

<DropdownMenuPortal {...portalProps}>
	<DropdownMenuPrimitive.Content
		bind:ref
		data-slot="dropdown-menu-content"
		{sideOffset}
		{align}
		class={cn(
			// templUI dropdown content = popover content + dropdown overrides (dropdown.templ).
		"z-50 m-0 min-w-[8rem] max-w-[min(24rem,calc(100vw-2rem))] max-h-[min(24rem,calc(100dvh_-_2rem))] overflow-x-hidden overflow-y-auto rounded-md border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none focus:outline-none transition-opacity duration-150 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none",
			className
		)}
		{...restProps}
	/>
</DropdownMenuPortal>
