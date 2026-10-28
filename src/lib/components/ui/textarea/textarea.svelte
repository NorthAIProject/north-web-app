<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "#lib/utils.js";
	import type { HTMLTextareaAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		autoResize = false,
		"data-slot": dataSlot = "textarea",
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> & {
		/** templUI AutoResize: grow with content (field-sizing replaces textarea.js). */
		autoResize?: boolean;
	} = $props();
</script>

<!-- Matches templUI textarea (web/shared/ui/textarea/textarea.templ). -->
<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		"flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm min-h-[80px] dark:bg-input/30 selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40",
		autoResize && "field-sizing-content overflow-hidden resize-none",
		className
	)}
	bind:value
	{...restProps}></textarea>
