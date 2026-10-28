<script lang="ts">
	import { onMount } from "svelte";
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { InputOTPState, setInputOTPContext } from "./context.svelte.js";

	type Props = WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "id">> & {
		/** ID of the hidden value input (labels can point at it); the container gets `${id}-container`. */
		id?: string;
		value?: string;
		name?: string;
		form?: string;
		hasError?: boolean;
		autofocus?: boolean;
		onValueChange?: (value: string) => void;
		/** Called when every slot has a character. */
		onComplete?: (value: string) => void;
	};

	let {
		ref = $bindable(null),
		class: className,
		id,
		value = $bindable(""),
		name,
		form,
		hasError = false,
		autofocus = false,
		onValueChange,
		onComplete,
		children,
		...restProps
	}: Props = $props();

	const ctx = setInputOTPContext(
		new InputOTPState((v) => {
			value = v;
			onValueChange?.(v);
			if (ctx.chars.length > 0 && ctx.chars.every(Boolean)) onComplete?.(v);
		}),
	);

	$effect.pre(() => {
		if (value !== ctx.value) ctx.setFromString(value ?? "");
	});

	onMount(() => {
		if (autofocus) requestAnimationFrame(() => ctx.focusFirst());
	});
</script>

<div
	bind:this={ref}
	id={id ? `${id}-container` : undefined}
	data-slot="input-otp"
	class={cn("flex flex-row items-center gap-2 w-fit", className)}
	{...restProps}
>
	<input
		type="hidden"
		{id}
		{name}
		{form}
		value={ctx.value}
		aria-invalid={hasError ? "true" : undefined}
	/>
	{@render children?.()}
</div>
