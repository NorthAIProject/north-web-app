<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// The heading level follows the page outline, not the look: a card directly
	// under the page's h1 is an h2 (the default); a card inside a section with
	// its own h2 passes level={3}. Auth cards under AuthShell's h1 stay at 2.
	let {
		ref = $bindable(null),
		class: className,
		level = 2,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLHeadingElement>> & { level?: 1 | 2 | 3 | 4 } = $props();
</script>

<svelte:element
	this={`h${level}`}
	bind:this={ref}
	data-slot="card-title"
	class={cn("text-lg font-semibold leading-none tracking-tight", className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
