<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: SelectPrimitive.ValueProps = $props();
</script>

<!-- templUI selectbox value: muted while showing the placeholder. -->
<SelectPrimitive.Value
	bind:ref
	data-slot="select-value"
	class={cn("block truncate data-[placeholder]:text-muted-foreground", className)}
	{...restProps}
/>
