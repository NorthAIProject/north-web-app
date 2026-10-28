<script lang="ts">
	import { Progress as ProgressPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "#lib/utils.js";

	type Size = "sm" | "default" | "lg";
	type Variant = "default" | "success" | "danger" | "warning";

	let {
		ref = $bindable(null),
		class: className,
		max = 100,
		value,
		label,
		showValue = false,
		size = "default",
		variant = "default",
		barClass,
		...restProps
	}: WithoutChildrenOrChild<ProgressPrimitive.RootProps> & {
		/** templUI Label: text shown above the bar, left. */
		label?: string;
		/** templUI ShowValue: percentage shown above the bar, right. */
		showValue?: boolean;
		size?: Size;
		variant?: Variant;
		/** templUI BarClass: extra classes for the filled bar. */
		barClass?: string;
	} = $props();

	const sizeClasses: Record<Size, string> = { sm: "h-1", default: "h-2.5", lg: "h-4" };
	const variantClasses: Record<Variant, string> = {
		default: "bg-primary",
		success: "bg-green-500",
		danger: "bg-destructive",
		warning: "bg-yellow-500",
	};

	const percent = $derived.by(() => {
		const m = max && max > 0 ? max : 100;
		const v = Math.min(Math.max(value ?? 0, 0), m);
		return Math.floor((v * 100) / m);
	});
</script>

<!-- Matches templUI progress (web/shared/ui/progress/progress.templ). -->
<ProgressPrimitive.Root
	bind:ref
	data-slot="progress"
	class={cn("w-full", className)}
	{value}
	{max}
	{...restProps}
>
	{#if label || showValue}
		<div class="mb-1 flex items-center justify-between">
			{#if label}
				<span class="text-sm font-medium">{label}</span>
			{/if}
			{#if showValue}
				<span class="text-sm font-medium">{percent}%</span>
			{/if}
		</div>
	{/if}
	<div class="w-full overflow-hidden rounded-full bg-secondary">
		<div
			data-slot="progress-indicator"
			class={cn(
				"h-full rounded-full transition-all",
				sizeClasses[size],
				variantClasses[variant],
				barClass
			)}
			style:width="{percent}%"
		></div>
	</div>
</ProgressPrimitive.Root>
