<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { RatingState, setRatingContext } from "./context.svelte.js";

	type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		value?: number;
		readonly?: boolean;
		/** Step used when rounding a selection (default 1). */
		precision?: number;
		onlyInteger?: boolean;
		/** When set, a hidden input carries the value (formatted to 2 decimals) for form posts. */
		name?: string;
		form?: string;
		onValueChange?: (value: number, maxValue: number) => void;
	};

	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(0),
		readonly = false,
		precision = 1,
		onlyInteger = false,
		name,
		form,
		onValueChange,
		children,
		...restProps
	}: Props = $props();

	const ctx = setRatingContext(
		new RatingState({
			readonly: () => readonly,
			precision: () => precision,
			onlyInteger: () => onlyInteger,
			onValueChange: (v, max) => {
				value = v;
				onValueChange?.(v, max);
			},
		}),
	);

	$effect.pre(() => {
		const p = precision > 0 ? precision : 1;
		const clamped = Math.max(0, Math.min(ctx.maxValue, value));
		ctx.value = Math.round(clamped / p) * p;
	});
</script>

<div
	bind:this={ref}
	data-slot="rating"
	data-readonly={readonly ? "" : undefined}
	class={cn("flex flex-col items-start gap-1", readonly && "cursor-default", className)}
	onmouseleave={() => ctx.leave()}
	{...restProps}
>
	{@render children?.()}
	{#if name}
		<input type="hidden" {name} {form} value={ctx.value.toFixed(2)} />
	{/if}
</div>
