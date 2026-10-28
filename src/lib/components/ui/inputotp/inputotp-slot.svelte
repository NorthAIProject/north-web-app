<script lang="ts">
	import { cn } from "#lib/utils.js";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { getInputOTPContext } from "./context.svelte.js";

	type Props = Omit<HTMLInputAttributes, "value" | "type"> & {
		index: number;
		type?: "text" | "password" | "number" | "tel";
		hasError?: boolean;
		/** Class for the wrapping div. */
		wrapperClass?: string;
	};

	let {
		class: className,
		wrapperClass,
		index,
		type = "text",
		placeholder,
		disabled = false,
		hasError = false,
		...restProps
	}: Props = $props();

	const otp = getInputOTPContext();
	let el = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (el) return otp.register(index, el);
	});

	function oninput(e: Event & { currentTarget: HTMLInputElement }) {
		let v = e.currentTarget.value;
		if (v === " ") v = "";
		if (v.length > 1) v = v.slice(-1);
		e.currentTarget.value = v;
		otp.set(index, v);
		if (v) otp.focus(otp.next(index));
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === "Backspace") {
			e.preventDefault();
			if (otp.chars[index]) {
				otp.set(index, "");
			} else {
				const prev = otp.prev(index);
				if (prev !== undefined) {
					otp.set(prev, "");
					otp.focus(prev);
				}
			}
		} else if (e.key === "ArrowLeft") {
			e.preventDefault();
			otp.focus(otp.prev(index));
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			otp.focus(otp.next(index));
		}
	}

	function onfocus(e: FocusEvent & { currentTarget: HTMLInputElement }) {
		const first = otp.firstEmpty();
		if (first !== undefined && first !== index) {
			otp.focus(first);
			return;
		}
		const target = e.currentTarget;
		setTimeout(() => target.select(), 0);
	}

	function onpaste(e: ClipboardEvent) {
		e.preventDefault();
		otp.paste(index, e.clipboardData?.getData("text") ?? "");
	}
</script>

<div class={cn("relative", wrapperClass)}>
	<input
		bind:this={el}
		{type}
		inputmode="numeric"
		{placeholder}
		maxlength={1}
		value={otp.chars[index] ?? ""}
		{disabled}
		aria-invalid={hasError ? "true" : undefined}
		data-slot="input-otp-slot"
		data-index={index}
		class={cn(
			"w-10 h-12 text-center rounded-md border border-input bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
			"dark:bg-input/30",
			"selection:bg-primary selection:text-primary-foreground",
			"placeholder:text-muted-foreground",
			"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
			"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
			"aria-invalid:ring-destructive/20 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40",
			hasError && "border-destructive ring-destructive/20 dark:ring-destructive/40",
			className,
		)}
		{oninput}
		{onkeydown}
		{onfocus}
		{onpaste}
		{...restProps}
	/>
</div>
