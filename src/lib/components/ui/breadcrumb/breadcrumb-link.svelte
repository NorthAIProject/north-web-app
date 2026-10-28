<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> = $props();
</script>

<a
	bind:this={ref}
	data-slot="breadcrumb-link"
	class={cn("text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1.5 transition-colors", className)}
	{...restProps}
>
	{@render children?.()}
</a>
