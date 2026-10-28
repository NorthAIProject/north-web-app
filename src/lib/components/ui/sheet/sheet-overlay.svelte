<script lang="ts">
	import { Dialog as SheetPrimitive } from "bits-ui";
	import { cn } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: SheetPrimitive.OverlayProps = $props();
</script>

<SheetPrimitive.Overlay
	bind:ref
	data-slot="sheet-overlay"
	class={cn(
		// templUI uses the native <dialog> ::backdrop (bg-black/50, 200ms fade).
		"fixed inset-0 z-50 bg-black/50 transition-all duration-200 data-[starting-style]:bg-black/0 data-[ending-style]:bg-black/0",
		className
	)}
	{...restProps}
/>
