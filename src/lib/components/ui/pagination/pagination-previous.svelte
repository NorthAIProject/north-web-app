<script lang="ts">
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import { Button, type ButtonProps } from "#lib/components/ui/button/index.js";
	import { cn } from "#lib/utils.js";

	type Props = Omit<ButtonProps, "variant" | "size"> & { label?: string };

	let {
		ref = $bindable(null),
		class: className,
		href,
		disabled = false,
		label,
		...restProps
	}: Props = $props();
</script>

<Button
	bind:ref
	data-slot="pagination-previous"
	aria-label={label ? undefined : "Go to previous page"}
	href={disabled ? undefined : href}
	{disabled}
	variant="ghost"
	class={cn("gap-1", className)}
	{...restProps}
>
	<ChevronLeftIcon class="size-4" />
	{#if label}<span>{label}</span>{/if}
</Button>
