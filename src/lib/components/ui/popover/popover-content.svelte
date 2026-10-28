<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "#lib/utils.js";
	import PopoverPortal from "./popover-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		showArrow = false,
		sideOffset,
		align = "center",
		portalProps,
		children,
		...restProps
	}: PopoverPrimitive.ContentProps & {
		/** templUI ShowArrow. */
		showArrow?: boolean;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof PopoverPortal>>;
	} = $props();
</script>

<!-- Matches templUI popover content (web/shared/ui/popover/popover.templ). Note
     templUI content has no padding; callers add it. Offset 4, or 8 with arrow. -->
<PopoverPortal {...portalProps}>
	<PopoverPrimitive.Content
		bind:ref
		data-slot="popover-content"
		sideOffset={sideOffset ?? (showArrow ? 8 : 4)}
		{align}
		class={cn(
			"z-50 m-0 max-w-[min(24rem,calc(100vw-2rem))] overflow-visible rounded-lg border bg-popover text-sm text-popover-foreground shadow-lg outline-none transition-opacity duration-150 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none",
			className
		)}
		{...restProps}
	>
		<div class="w-full overflow-hidden">
			{@render children?.()}
		</div>
		{#if showArrow}
			<PopoverPrimitive.Arrow>
				{#snippet child({ props })}
					<span {...props} class="block h-[5px] w-2.5">
						<span
							data-slot="popover-arrow"
							class="absolute top-0 left-0 size-2.5 -translate-y-1/2 rotate-45 border border-border border-t-transparent border-l-transparent bg-popover"
						></span>
					</span>
				{/snippet}
			</PopoverPrimitive.Arrow>
		{/if}
	</PopoverPrimitive.Content>
</PopoverPortal>
