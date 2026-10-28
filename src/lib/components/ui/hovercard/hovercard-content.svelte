<script lang="ts" module>
	export type HoverCardPlacement =
		| "top"
		| "top-start"
		| "top-end"
		| "right"
		| "right-start"
		| "right-end"
		| "bottom"
		| "bottom-start"
		| "bottom-end"
		| "left"
		| "left-start"
		| "left-end";
</script>

<script lang="ts">
	import { LinkPreview as LinkPreviewPrimitive } from "bits-ui";
	import { cn } from "#lib/utils.js";

	type Props = Omit<LinkPreviewPrimitive.ContentProps, "side" | "align"> & {
		placement?: HoverCardPlacement;
		/** Distance from the trigger in px (templUI default: 4, or 8 with an arrow). */
		offset?: number;
		showArrow?: boolean;
	};

	let {
		ref = $bindable(null),
		class: className,
		placement = "bottom",
		offset,
		showArrow = false,
		children,
		...restProps
	}: Props = $props();

	const side = $derived(placement.split("-")[0] as "top" | "right" | "bottom" | "left");
	const align = $derived(
		(placement.split("-")[1] ?? "center") as "start" | "center" | "end",
	);
</script>

<LinkPreviewPrimitive.Portal>
	<LinkPreviewPrimitive.Content
		bind:ref
		data-slot="hover-card-content"
		{side}
		{align}
		sideOffset={offset ?? (showArrow ? 8 : 4)}
		class={cn(
			"bg-popover rounded-lg border text-popover-foreground text-sm shadow-lg pointer-events-auto z-50 m-0 max-w-[min(24rem,calc(100vw-2rem))] overflow-visible outline-none transition-opacity duration-150 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100 motion-reduce:transition-none",
			"w-64 p-4",
			className,
		)}
		{...restProps}
	>
		<div class="w-full overflow-hidden">
			{@render children?.()}
		</div>
		{#if showArrow}
			<LinkPreviewPrimitive.Arrow width={10} height={5}>
				{#snippet child({ props })}
					<div
						{...props}
						data-slot="hover-card-arrow"
						class="h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-popover border border-border border-t-0 border-l-0"
					></div>
				{/snippet}
			</LinkPreviewPrimitive.Arrow>
		{/if}
	</LinkPreviewPrimitive.Content>
</LinkPreviewPrimitive.Portal>
