<script lang="ts">
	import { Label as LabelPrimitive } from "bits-ui";
	import { cn } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		error,
		disabled = false,
		...restProps
	}: LabelPrimitive.RootProps & {
		/** templUI Error: any truthy value turns the label destructive. */
		error?: string | boolean;
		/** templUI dims the label when its target is disabled (label.js). */
		disabled?: boolean;
	} = $props();
</script>

<!-- Matches templUI label (web/shared/ui/label/label.templ). -->
<LabelPrimitive.Root
	bind:ref
	data-slot="label"
	class={cn(
		"text-sm font-medium leading-none inline-block peer-disabled:opacity-50 peer-disabled:cursor-not-allowed group-data-[disabled=true]:opacity-50 group-data-[disabled=true]:pointer-events-none",
		error && "text-destructive",
		disabled && "opacity-50 cursor-not-allowed",
		className
	)}
	{...restProps}
/>
