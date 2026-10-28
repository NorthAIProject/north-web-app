<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import { cn, type WithoutChild } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> & {
		size?: "sm" | "default";
	} = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	data-size={size}
	class={cn(
		// templUI selectbox trigger = outline Button + input-like overrides (selectbox.templ).
		"flex w-full cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-1 text-base font-medium shadow-xs transition-[color,box-shadow] outline-none select-none md:text-sm hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 selection:bg-primary selection:text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[size=default]:h-9 data-[size=sm]:h-8 data-[size=sm]:px-2.5",
		"*:data-[slot=select-value]:min-w-0",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<span class="pointer-events-none ml-1">
		<ChevronDownIcon class="size-4 text-muted-foreground" />
	</span>
</SelectPrimitive.Trigger>
