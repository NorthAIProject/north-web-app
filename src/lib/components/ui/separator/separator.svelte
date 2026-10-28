<script lang="ts">
	import { Separator as SeparatorPrimitive } from "bits-ui";
	import { cn } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		orientation = "horizontal",
		decoration,
		children,
		"data-slot": dataSlot = "separator",
		...restProps
	}: SeparatorPrimitive.RootProps & {
		/** templUI Decoration. */
		decoration?: "dashed" | "dotted";
	} = $props();

	const decorationClass = $derived(
		decoration === "dashed" ? "border-dashed" : decoration === "dotted" ? "border-dotted" : ""
	);
</script>

<!-- Matches templUI separator (web/shared/ui/separator/separator.templ): a
     border line with an optional centred label. -->
<SeparatorPrimitive.Root
	bind:ref
	data-slot={dataSlot}
	{orientation}
	class={cn(orientation === "vertical" ? "shrink-0 h-full" : "shrink-0 w-full", className)}
	{...restProps}
>
	{#if orientation === "vertical"}
		<div class="relative flex h-full flex-col items-center">
			<span class={cn("absolute h-full w-[1px] border-l", decorationClass)} aria-hidden="true"
			></span>
			<span class="relative my-auto bg-background py-2 text-xs text-muted-foreground">
				{@render children?.()}
			</span>
		</div>
	{:else}
		<div class="relative flex w-full items-center">
			<span class={cn("absolute h-[1px] w-full border-t", decorationClass)} aria-hidden="true"
			></span>
			<span class="relative mx-auto bg-background px-2 text-xs text-muted-foreground">
				{@render children?.()}
			</span>
		</div>
	{/if}
</SeparatorPrimitive.Root>
