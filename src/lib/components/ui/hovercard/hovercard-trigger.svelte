<script lang="ts">
	import { LinkPreview as LinkPreviewPrimitive } from "bits-ui";
	import { cn } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		href,
		children,
		...restProps
	}: LinkPreviewPrimitive.TriggerProps = $props();
</script>

{#if href}
	<LinkPreviewPrimitive.Trigger
		bind:ref
		{href}
		data-slot="hover-card-trigger"
		class={className}
		{...restProps}
	>
		{@render children?.()}
	</LinkPreviewPrimitive.Trigger>
{:else}
	<!-- templUI's trigger is a `contents` wrapper; floating-ui needs a box to anchor to, so this is an inline span. -->
	<LinkPreviewPrimitive.Trigger bind:ref {...restProps}>
		{#snippet child({ props })}
			<span {...props} data-slot="hover-card-trigger" class={cn("inline-block", className)}>
				{@render children?.()}
			</span>
		{/snippet}
	</LinkPreviewPrimitive.Trigger>
{/if}
