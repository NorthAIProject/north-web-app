<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "children">> = $props();
</script>

<div
	bind:this={ref}
	role="separator"
	data-slot="input-otp-separator"
	class={cn("flex items-center text-muted-foreground text-xl", className)}
	{...restProps}
>
	<span>-</span>
</div>
