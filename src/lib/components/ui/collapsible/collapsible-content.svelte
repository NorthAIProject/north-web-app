<script lang="ts">
	import { Collapsible as CollapsiblePrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		forceMount = true,
		children,
		...restProps
	}: WithoutChild<CollapsiblePrimitive.ContentProps> = $props();
</script>

<!-- Matches templUI collapsible content (collapsible.templ): stays mounted and
     animates grid-template-rows 0fr -> 1fr over 200ms. Pass forceMount={false}
     for bits-ui's unmount-when-closed behaviour (no animation). -->
<CollapsiblePrimitive.Content
	bind:ref
	data-slot="collapsible-content"
	{forceMount}
	class={cn(
		"grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out data-[state=open]:grid-rows-[1fr]",
		className
	)}
	{...restProps}
>
	<div class="overflow-hidden">
		{@render children?.()}
	</div>
</CollapsiblePrimitive.Content>
