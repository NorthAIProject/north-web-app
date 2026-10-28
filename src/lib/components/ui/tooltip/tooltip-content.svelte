<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import { cn } from "#lib/utils.js";
	import type { WithoutChildrenOrChild } from "#lib/utils.js";
	import TooltipPortal from "./tooltip-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		showArrow = false,
		sideOffset,
		side = "top",
		children,
		arrowClasses,
		portalProps,
		...restProps
	}: TooltipPrimitive.ContentProps & {
		/** templUI ShowArrow (off by default, like templUI). */
		showArrow?: boolean;
		arrowClasses?: string;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof TooltipPortal>>;
	} = $props();
</script>

<!-- Matches templUI tooltip (popover content + "px-4 py-1 bg-foreground text-background"). -->
<TooltipPortal {...portalProps}>
	<TooltipPrimitive.Content
		bind:ref
		data-slot="tooltip-content"
		sideOffset={sideOffset ?? (showArrow ? 8 : 4)}
		{side}
		class={cn(
			"z-50 m-0 max-w-[min(24rem,calc(100vw-2rem))] overflow-visible rounded-lg border bg-foreground px-4 py-1 text-sm text-background shadow-lg outline-none transition-opacity duration-150 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none",
			className
		)}
		{...restProps}
	>
		<div class="w-full overflow-hidden">
			{@render children?.()}
		</div>
		{#if showArrow}
			<TooltipPrimitive.Arrow>
				{#snippet child({ props })}
					<span {...props} class="block h-[5px] w-2.5">
						<span
							data-slot="tooltip-arrow"
							class={cn(
								"absolute top-0 left-0 size-2.5 -translate-y-1/2 rotate-45 border-0 bg-foreground",
								arrowClasses
							)}
						></span>
					</span>
				{/snippet}
			</TooltipPrimitive.Arrow>
		{/if}
	</TooltipPrimitive.Content>
</TooltipPortal>
