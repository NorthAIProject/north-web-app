<script lang="ts" module>
	export type Side = "top" | "right" | "bottom" | "left";
</script>

<script lang="ts">
	import { Dialog as SheetPrimitive } from "bits-ui";
	import XIcon from "@lucide/svelte/icons/x";
	import { cn, type WithoutChildrenOrChild } from "#lib/utils.js";
	import SheetOverlay from "./sheet-overlay.svelte";
	import SheetPortal from "./sheet-portal.svelte";
	import type { Snippet } from "svelte";
	import type { ComponentProps } from "svelte";
	import { useI18n } from "#lib/i18n/index.js";

	let {
		ref = $bindable(null),
		class: className,
		side = "right",
		showCloseButton = true,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SheetPortal>>;
		side?: Side;
		showCloseButton?: boolean;
		children: Snippet;
	} = $props();

	const i18n = useI18n();
</script>

<SheetPortal {...portalProps}>
	<SheetOverlay />
	<SheetPrimitive.Content
		bind:ref
		data-slot="sheet-content"
		data-side={side}
		class={cn(
			// templUI sheet = dialog content + side overrides (sheet.templ getSideClasses):
			// slide only, no fade/scale; 500ms in, 300ms out. Reduced motion: no slide.
			// A top/bottom sheet never outgrows the viewport; side sheets are already h-dvh.
			"fixed z-50 m-0 flex max-h-dvh flex-col gap-4 overflow-hidden border-0 bg-background p-0 text-foreground shadow-lg outline-none transition-transform ease-in-out duration-500 data-[ending-style]:duration-300 motion-reduce:transition-none",
			"data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-dvh data-[side=right]:max-h-dvh data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:sm:max-w-sm data-[side=right]:data-[starting-style]:translate-x-full data-[side=right]:data-[ending-style]:translate-x-full",
			"data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-dvh data-[side=left]:max-h-dvh data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:sm:max-w-sm data-[side=left]:data-[starting-style]:-translate-x-full data-[side=left]:data-[ending-style]:-translate-x-full",
			"data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:w-full data-[side=top]:max-w-full data-[side=top]:border-b data-[side=top]:data-[starting-style]:-translate-y-full data-[side=top]:data-[ending-style]:-translate-y-full",
			"data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:w-full data-[side=bottom]:max-w-full data-[side=bottom]:border-t data-[side=bottom]:data-[starting-style]:translate-y-full data-[side=bottom]:data-[ending-style]:translate-y-full",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		{#if showCloseButton}
			<SheetPrimitive.Close
				data-slot="sheet-close"
				class={"absolute top-3 right-3 inline-flex size-6 items-center justify-center rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background pointer-coarse:top-1 pointer-coarse:right-1 pointer-coarse:size-11 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer"}
			>
				<XIcon />
				<span class="sr-only">{i18n.t("layout.close")}</span>
			</SheetPrimitive.Close>
		{/if}
	</SheetPrimitive.Content>
</SheetPortal>
