<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";
	import CheckIcon from "@lucide/svelte/icons/check";
	import MinusIcon from "@lucide/svelte/icons/minus";
	import { cn, type WithoutChildrenOrChild } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		icon,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> & {
		/** templUI Icon: replaces the check mark. */
		icon?: Snippet;
	} = $props();
</script>

<!-- Matches templUI checkbox (web/shared/ui/checkbox/checkbox.templ). -->
<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		"peer relative flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:border-primary aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
		className
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div
			data-slot="checkbox-indicator"
			class="pointer-events-none flex items-center justify-center text-primary-foreground [&>svg]:size-3.5"
		>
			{#if indeterminate}
				<MinusIcon />
			{:else if checked}
				{#if icon}{@render icon()}{:else}<CheckIcon />{/if}
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
