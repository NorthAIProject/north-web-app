<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DropdownMenuPrimitive.GroupProps = $props();
</script>

<!-- templUI dropdown Group: "py-1". -->
<DropdownMenuPrimitive.Group
	bind:ref
	data-slot="dropdown-menu-group"
	class={cn("py-1", className)}
	{...restProps}
/>
